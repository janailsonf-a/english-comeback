const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createGameSession } = require("../.game-check/domain/gameSession");
const { applyJourneyAction } = require("../.game-check/journey/rules");
const {
  applyDeveloperAction,
} = require("../.game-check/journey/developerActions");
const { initialNarrative } = require("../.game-check/journey/narrative/rules");
const { projectJourney } = require("../.game-check/journey/projectSnapshot");
const { dailyQuests } = require("../.game-check/journey/selectors");
const { startJourney } = require("../.game-check/journey/stateFactory");
const {
  MISSION_DEFINITIONS,
  missionDefinition,
} = require("../.game-check/missions/content");
const { migrateMissionState } = require("../.game-check/missions/migration");
const {
  bossPreparation,
  interactiveMissionsCompleted,
  missionCompletion,
  missionStatus,
} = require("../.game-check/missions/selectors");
const { rewardSequence } = require("../.game-check/missions/rewardSequence");
const { applyMissionAction } = require("../.game-check/missions/rules");
const {
  MISSION_SCHEMA_VERSION,
  MISSION_STORAGE_KEY,
  createMissionStorage,
} = require("../.game-check/persistence/missionStorage");
const {
  NARRATIVE_STORAGE_KEY,
} = require("../.game-check/persistence/narrativeStorage");
const { mockGameService } = require("../.game-check/services/gameService");

const at = (day = "2026-09-22", hour = 15) => ({
  day,
  instant: `${day}T${String(hour).padStart(2, "0")}:00:00.000Z`,
});
const now = at();
const fresh = () => ({
  ...startJourney(now),
  narrative: initialNarrative(true),
});

function memory() {
  const values = new Map();
  const writes = [];
  return {
    values,
    writes,
    async getItem(key) {
      return values.get(key) ?? null;
    },
    async setItem(key, value) {
      values.set(key, value);
      writes.push(key);
    },
  };
}

function runInteractive(state, questId, options = {}) {
  const quest = state.quests.find((item) => item.id === questId);
  const definition = missionDefinition(quest?.interactiveMissionId ?? "");
  assert.ok(definition && definition.type !== "EXTERNAL");
  let result = applyMissionAction(state, { type: "start", questId }, now);
  let next = result.journey;
  if (definition.type === "LISTENING")
    next = applyMissionAction(
      next,
      { type: "audioPlayed", questId },
      now,
    ).journey;
  while (next.missions.active) {
    const run = next.missions.active;
    const step = definition.steps[run.currentStep];
    if (step.kind !== "PROMPT") {
      const value =
        step.kind === "MANUAL_PRACTICE"
          ? "My own practice sentence."
          : options.wrong
            ? step.options.find((item) => item.id !== step.correctOptionId).id
            : step.correctOptionId;
      next = applyMissionAction(
        next,
        {
          type: "answer",
          questId,
          stepId: step.id,
          value,
          elapsedSeconds: definition.minimumActiveSeconds,
        },
        now,
      ).journey;
    }
    const current = next.missions.active;
    if (!current || current.currentStep === definition.steps.length - 1) break;
    next = applyMissionAction(
      next,
      {
        type: "advance",
        questId,
        stepId: step.id,
        elapsedSeconds: definition.minimumActiveSeconds,
      },
      now,
    ).journey;
  }
  return applyMissionAction(
    next,
    {
      type: "complete",
      questId,
      elapsedSeconds: definition.minimumActiveSeconds,
      recording: options.recording,
    },
    now,
  );
}

test("World 01 provides ten typed interactive missions separated from external content", () => {
  const interactive = MISSION_DEFINITIONS.filter(
    (item) => item.type !== "EXTERNAL",
  );
  assert.equal(interactive.length, 10);
  assert.deepEqual(
    Object.fromEntries(
      ["SPEAKING", "LISTENING", "READING", "VOCABULARY"].map((type) => [
        type,
        interactive.filter((item) => item.type === type).length,
      ]),
    ),
    { SPEAKING: 3, LISTENING: 2, READING: 2, VOCABULARY: 3 },
  );
  assert.equal(
    new Set(MISSION_DEFINITIONS.map((item) => item.id)).size,
    MISSION_DEFINITIONS.length,
  );
});

test("mission creation moves AVAILABLE to IN_PROGRESS without XP", () => {
  const s = fresh();
  const quest = dailyQuests(s)[0];
  const result = applyMissionAction(
    s,
    { type: "start", questId: quest.id },
    now,
  );
  assert.equal(missionStatus(s, quest), "AVAILABLE");
  assert.equal(result.journey.missions.active.status, "IN_PROGRESS");
  assert.equal(
    result.journey.missions.active.missionId,
    quest.interactiveMissionId,
  );
  assert.equal(result.journey.totalXpEarned, 0);
  assert.equal(result.feedback, null);
});

test("invalid transitions cannot skip a question or complete a mission early", () => {
  const s = fresh();
  const quest = dailyQuests(s)[0];
  const started = applyMissionAction(
    s,
    { type: "start", questId: quest.id },
    now,
  ).journey;
  const step = missionDefinition(quest.interactiveMissionId).steps[0];
  assert.equal(
    applyMissionAction(
      started,
      {
        type: "advance",
        questId: quest.id,
        stepId: step.id,
        elapsedSeconds: 10,
      },
      now,
    ).journey,
    started,
  );
  assert.equal(
    applyMissionAction(
      started,
      { type: "complete", questId: quest.id, elapsedSeconds: 600 },
      now,
    ).journey,
    started,
  );
});

test("pause and resume preserve monotonic timer state without rewards", () => {
  const s = fresh();
  const quest = dailyQuests(s)[1];
  let next = applyMissionAction(
    s,
    { type: "start", questId: quest.id },
    now,
  ).journey;
  next = applyMissionAction(
    next,
    { type: "pause", questId: quest.id, elapsedSeconds: 41 },
    now,
  ).journey;
  assert.equal(next.missions.active.status, "PAUSED");
  assert.equal(next.missions.active.elapsedSeconds, 41);
  const unchanged = applyMissionAction(
    next,
    { type: "pause", questId: quest.id, elapsedSeconds: 10 },
    now,
  ).journey;
  assert.equal(unchanged, next);
  next = applyMissionAction(
    next,
    { type: "resume", questId: quest.id },
    now,
  ).journey;
  assert.equal(next.missions.active.status, "IN_PROGRESS");
  assert.equal(next.totalXpEarned, 0);
});

test("Speaking requires the configured minimum active time", () => {
  const s = fresh();
  const quest = dailyQuests(s)[1];
  const definition = missionDefinition(quest.interactiveMissionId);
  let next = applyMissionAction(
    s,
    { type: "start", questId: quest.id },
    now,
  ).journey;
  for (const step of definition.steps.slice(0, -1))
    next = applyMissionAction(
      next,
      {
        type: "advance",
        questId: quest.id,
        stepId: step.id,
        elapsedSeconds: 20,
      },
      now,
    ).journey;
  const run = next.missions.active;
  assert.equal(missionCompletion(definition, run, 179).timeReady, false);
  assert.equal(
    applyMissionAction(
      next,
      { type: "complete", questId: quest.id, elapsedSeconds: 179 },
      now,
    ).journey,
    next,
  );
  assert.equal(
    applyMissionAction(
      next,
      { type: "complete", questId: quest.id, elapsedSeconds: 180 },
      now,
    ).feedback.xpAwarded,
    30,
  );
});

test("Speaking attempts can keep a safe local recording reference", () => {
  const s = fresh();
  const quest = dailyQuests(s)[1];
  const result = runInteractive(s, quest.id, {
    recording: {
      localRecordingReference: "Audio/Missions/break-one.m4a",
      durationSeconds: 180,
    },
  });
  assert.equal(
    result.journey.missions.attempts[0].localRecordingReference,
    "Audio/Missions/break-one.m4a",
  );
});

test("Listening records correct and incorrect answers without removing XP", () => {
  const s = fresh();
  const quest = dailyQuests(s)[0];
  const result = runInteractive(s, quest.id, { wrong: true });
  assert.ok(
    result.journey.missions.attempts[0].answers.every(
      (answer) => answer.correct === false,
    ),
  );
  assert.equal(result.feedback.xpAwarded, quest.xpReward);
});

test("Listening cannot complete before local audio has been played", () => {
  const s = fresh();
  const quest = dailyQuests(s)[0];
  const definition = missionDefinition(quest.interactiveMissionId);
  let next = applyMissionAction(
    s,
    { type: "start", questId: quest.id },
    now,
  ).journey;
  for (const step of definition.steps) {
    next = applyMissionAction(
      next,
      {
        type: "answer",
        questId: quest.id,
        stepId: step.id,
        value: step.correctOptionId,
        elapsedSeconds: 5,
      },
      now,
    ).journey;
    if (step !== definition.steps.at(-1))
      next = applyMissionAction(
        next,
        {
          type: "advance",
          questId: quest.id,
          stepId: step.id,
          elapsedSeconds: 5,
        },
        now,
      ).journey;
  }
  assert.equal(
    applyMissionAction(
      next,
      { type: "complete", questId: quest.id, elapsedSeconds: 5 },
      now,
    ).journey,
    next,
  );
});

test("Reading and Vocabulary answers are stored in typed attempts", () => {
  let s = fresh();
  for (let day = 0; day < 2; day++) {
    for (const quest of dailyQuests(s)) {
      const definition = missionDefinition(quest.interactiveMissionId ?? "");
      s =
        definition && definition.type !== "EXTERNAL"
          ? runInteractive(s, quest.id).journey
          : applyJourneyAction(s, { type: "complete", questId: quest.id }, now)
              .journey;
    }
  }
  const reading = dailyQuests(s).find(
    (quest) =>
      missionDefinition(quest.interactiveMissionId ?? "")?.type === "READING",
  );
  const vocabulary = dailyQuests(s).find(
    (quest) =>
      missionDefinition(quest.interactiveMissionId ?? "")?.type ===
      "VOCABULARY",
  );
  const readResult = runInteractive(s, reading.id);
  const vocabResult = runInteractive(readResult.journey, vocabulary.id);
  const attempts = vocabResult.journey.missions.attempts.slice(-2);
  assert.deepEqual(
    attempts.map((attempt) => missionDefinition(attempt.missionId).type),
    ["READING", "VOCABULARY"],
  );
  assert.ok(attempts.every((attempt) => attempt.answers.length > 0));
});

test("External Quests retain manual confirmation compatibility", () => {
  const s = fresh();
  const quest = dailyQuests(s).find((item) => item.experience === "external");
  const result = applyJourneyAction(
    s,
    { type: "complete", questId: quest.id },
    now,
  );
  assert.equal(result.feedback.xpAwarded, quest.xpReward);
  assert.equal(result.journey.missions.attempts.length, 0);
});

test("a completed mission creates one attempt, session and XP ledger entry", () => {
  const s = fresh();
  const quest = dailyQuests(s)[0];
  const result = runInteractive(s, quest.id);
  assert.equal(result.journey.missions.attempts.length, 1);
  assert.equal(
    result.journey.sessions.filter((item) => item.source === "mission").length,
    1,
  );
  assert.equal(
    result.journey.xpRecords.filter((item) => item.id === `quest:${quest.id}`)
      .length,
    1,
  );
  assert.equal(interactiveMissionsCompleted(result.journey), 1);
});

test("duplicate mission completion cannot duplicate XP, attempt or Study Session", () => {
  const s = fresh();
  const quest = dailyQuests(s)[0];
  const first = runInteractive(s, quest.id);
  const duplicate = applyMissionAction(
    first.journey,
    { type: "complete", questId: quest.id, elapsedSeconds: 999 },
    now,
  );
  assert.equal(duplicate.journey, first.journey);
  assert.equal(duplicate.feedback, null);
  assert.equal(first.journey.missions.attempts.length, 1);
  assert.equal(first.journey.sessions.length, 1);
  assert.equal(first.journey.totalXpEarned, quest.xpReward);
});

test("three mixed Daily Quests grant one bonus and advance one Study Day", () => {
  let s = fresh();
  const quests = dailyQuests(s);
  for (const quest of quests)
    s =
      quest.experience === "interactive"
        ? runInteractive(s, quest.id).journey
        : applyJourneyAction(s, { type: "complete", questId: quest.id }, now)
            .journey;
  assert.equal(s.studyDays, 1);
  assert.equal(
    s.xpRecords.filter((record) => record.source === "day").length,
    1,
  );
  assert.equal(s.totalXpEarned, 80);
});

test("Reward Sequence orders completion, level, unlocks, day and chapter events", () => {
  assert.deepEqual(
    rewardSequence({
      questId: "q",
      xpAwarded: 50,
      levelsGained: 1,
      level: 5,
      missionId: "m",
      missionType: "SPEAKING",
      titleIds: ["the-returner"],
      achievementIds: [],
      dayComplete: 7,
    }).map((event) => event.type),
    [
      "MISSION_COMPLETE",
      "LEVEL_UP",
      "UNLOCKS",
      "STUDY_DAY_COMPLETE",
      "CHAPTER_ADVANCE",
    ],
  );
});

test("standalone title feedback starts directly at the unlock event", () => {
  assert.deepEqual(
    rewardSequence({
      questId: "title:the-returner",
      xpAwarded: 0,
      levelsGained: 0,
      level: 5,
      titleIds: ["the-returner"],
    }).map((event) => event.type),
    ["UNLOCKS"],
  );
});

test("Speaking mission preparation is separate from Boss HP and capped", () => {
  let s = fresh();
  const quest = dailyQuests(s)[1];
  s = runInteractive(s, quest.id).journey;
  assert.deepEqual(bossPreparation(s), { completed: 1, target: 5 });
  assert.deepEqual(s.boss.completedSteps, []);
});

test("developer completion bypass is isolated behind developmentData", () => {
  const s = fresh();
  const quest = dailyQuests(s)[1];
  const started = applyMissionAction(
    s,
    { type: "start", questId: quest.id },
    now,
  ).journey;
  assert.equal(
    applyMissionAction(
      started,
      {
        type: "complete",
        questId: quest.id,
        elapsedSeconds: 0,
        developerBypass: true,
      },
      now,
    ).journey,
    started,
  );
  const development = { ...started, developmentData: true };
  const result = applyMissionAction(
    development,
    {
      type: "complete",
      questId: quest.id,
      elapsedSeconds: 0,
      developerBypass: true,
    },
    now,
  );
  assert.ok(result.feedback);
  assert.equal(result.journey.missions.attempts[0].development, true);
  assert.equal(interactiveMissionsCompleted(result.journey), 0);
});

test("Developer Panel can resume and complete a paused mission through the real engine", () => {
  let s = fresh();
  const quest = dailyQuests(s)[1];
  s = applyMissionAction(s, { type: "start", questId: quest.id }, now).journey;
  s = applyMissionAction(
    s,
    { type: "pause", questId: quest.id, elapsedSeconds: 15 },
    now,
  ).journey;
  const result = applyDeveloperAction(s, "completeMission", now, true);
  assert.equal(result.journey.missions.active, null);
  assert.equal(result.journey.missions.attempts.length, 1);
  assert.equal(result.journey.missions.attempts[0].development, true);
  assert.equal(result.feedback.xpAwarded, quest.xpReward);
});

test("schema 3 migrates to schema 4 without changing permanent progress", async () => {
  const store = memory();
  let legacy = fresh();
  legacy = applyJourneyAction(
    legacy,
    { type: "complete", questId: "day-1:knowledge-scroll" },
    now,
  ).journey;
  const expectedXp = legacy.totalXpEarned;
  const old = structuredClone(legacy);
  delete old.missions;
  for (const quest of old.quests) {
    delete quest.experience;
    delete quest.interactiveMissionId;
    delete quest.worldId;
    delete quest.chapterId;
  }
  store.values.set(
    NARRATIVE_STORAGE_KEY,
    JSON.stringify({ schemaVersion: 3, journey: old }),
  );
  const loaded = await createMissionStorage(store).load(
    await mockGameService.loadGame(),
  );
  assert.equal(loaded.journey.totalXpEarned, expectedXp);
  assert.deepEqual(loaded.journey.sessions, legacy.sessions);
  assert.deepEqual(loaded.journey.narrative, legacy.narrative);
  assert.deepEqual(loaded.journey.missions, { active: null, attempts: [] });
  assert.equal(
    JSON.parse(store.values.get(MISSION_STORAGE_KEY)).schemaVersion,
    MISSION_SCHEMA_VERSION,
  );
  assert.ok(store.values.has(NARRATIVE_STORAGE_KEY));
});

test("an interrupted schema 4 mission reopens PAUSED and can resume", async () => {
  const store = memory();
  const initial = await mockGameService.loadGame();
  const quest = dailyQuests(fresh())[1];
  const started = applyMissionAction(
    fresh(),
    { type: "start", questId: quest.id },
    now,
  ).journey;
  await createMissionStorage(store).save(projectJourney(initial, started));
  const loaded = await createMissionStorage(store).load(initial);
  assert.equal(loaded.journey.missions.active.status, "PAUSED");
  const resumed = applyMissionAction(
    loaded.journey,
    { type: "resume", questId: quest.id },
    at("2026-09-22", 16),
  );
  assert.equal(resumed.journey.missions.active.status, "IN_PROGRESS");
  assert.equal(resumed.journey.totalXpEarned, 0);
});

test("schema 4 rejects duplicate attempts without overwriting either save", async () => {
  const store = memory();
  const initial = await mockGameService.loadGame();
  const quest = dailyQuests(fresh())[0];
  const completed = runInteractive(fresh(), quest.id).journey;
  await createMissionStorage(store).save(projectJourney(initial, completed));
  const parsed = JSON.parse(store.values.get(MISSION_STORAGE_KEY));
  parsed.journey.missions.attempts.push(parsed.journey.missions.attempts[0]);
  const malformed = JSON.stringify(parsed);
  store.values.set(MISSION_STORAGE_KEY, malformed);
  await assert.rejects(() => createMissionStorage(store).load(initial));
  assert.equal(store.values.get(MISSION_STORAGE_KEY), malformed);
});

test("serialized duplicate mission completion persists one reward", async () => {
  const store = memory();
  const initial = await mockGameService.loadGame();
  const quest = dailyQuests(fresh())[0];
  const ready = runInteractive(fresh(), quest.id).journey;
  const completedAttempt = ready.missions.attempts[0];
  const beforeReward = {
    ...ready,
    quests: ready.quests.map((item) =>
      item.id === quest.id
        ? { ...item, status: "active", completedAt: null }
        : item,
    ),
    sessions: [],
    xpRecords: [],
    totalXpEarned: 0,
    xp: 0,
    missions: { active: null, attempts: [completedAttempt] },
  };
  const session = createGameSession(
    projectJourney(initial, beforeReward),
    createMissionStorage(store),
  );
  const action = {
    type: "completeMission",
    questId: quest.id,
    attemptId: completedAttempt.id,
  };
  const [first, second] = await Promise.all([
    session.journey(action, now),
    session.journey(action, now),
  ]);
  assert.ok(first.feedback);
  assert.equal(second.feedback, null);
  assert.equal(second.snapshot.journey.sessions.length, 1);
  assert.equal(second.snapshot.journey.totalXpEarned, quest.xpReward);
});

test("migration only pauses active runs and is otherwise idempotent", () => {
  const s = fresh();
  const quest = dailyQuests(s)[1];
  const active = applyMissionAction(
    s,
    { type: "start", questId: quest.id },
    now,
  ).journey;
  const paused = migrateMissionState(active, true);
  assert.equal(paused.missions.active.status, "PAUSED");
  assert.equal(migrateMissionState(paused, true), paused);
});
