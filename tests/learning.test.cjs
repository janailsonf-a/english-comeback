const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createGameSession } = require("../.game-check/domain/gameSession");
const { applyJourneyAction } = require("../.game-check/journey/rules");
const { initialNarrative } = require("../.game-check/journey/narrative/rules");
const { projectJourney } = require("../.game-check/journey/projectSnapshot");
const { dailyQuests } = require("../.game-check/journey/selectors");
const {
  questsForDay,
  startJourney,
} = require("../.game-check/journey/stateFactory");
const {
  applyLearningAction,
  applyMissionLearning,
} = require("../.game-check/learning/rules");
const {
  learningMetrics,
  recommendedVocabularyMissionIds,
  vocabularyIsWeak,
} = require("../.game-check/learning/selectors");
const { missionDefinition } = require("../.game-check/missions/content");
const { applyMissionAction } = require("../.game-check/missions/rules");
const {
  createMissionStorage,
  MISSION_STORAGE_KEY,
} = require("../.game-check/persistence/missionStorage");
const {
  createLearningStorage,
  LEARNING_SCHEMA_VERSION,
  LEARNING_STORAGE_KEY,
} = require("../.game-check/persistence/learningStorage");
const { mockGameService } = require("../.game-check/services/gameService");

const at = (day = "2026-09-25", hour = 15) => ({
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
  return {
    values,
    async getItem(key) {
      return values.get(key) ?? null;
    },
    async setItem(key, value) {
      values.set(key, value);
    },
  };
}

function attempt({
  id,
  missionId = "memory-battle",
  stepId = "although",
  correct = true,
  day = "2026-09-25",
}) {
  return {
    id,
    missionId,
    questId: `quest:${id}`,
    startedAt: `${day}T14:55:00.000Z`,
    completedAt: `${day}T15:00:00.000Z`,
    durationSeconds: 120,
    answers: [
      {
        stepId,
        value: correct === null ? "My sentence." : correct ? stepId : "wrong",
        correct,
        answeredAt: `${day}T14:59:00.000Z`,
      },
    ],
    result: "COMPLETED",
    studyDay: 1,
    calendarDay: day,
    worldId: "the-comeback",
    chapterId: "the-return",
    localRecordingReference: null,
    development: false,
  };
}

function runInteractive(state, questId, wrong = false) {
  const quest = state.quests.find((item) => item.id === questId);
  const definition = missionDefinition(quest?.interactiveMissionId ?? "");
  assert.ok(definition && definition.type !== "EXTERNAL");
  let next = applyMissionAction(state, { type: "start", questId }, now).journey;
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
          ? "I improve through consistent practice."
          : wrong
            ? step.options.find(
                (option) => option.id !== step.correctOptionId,
              ).id
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
    const active = next.missions.active;
    if (!active || active.currentStep === definition.steps.length - 1) break;
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
    },
    now,
  );
}

function completeCurrentDay(state, wrongVocabulary = false) {
  let next = state;
  for (const quest of dailyQuests(next)) {
    const definition = missionDefinition(quest.interactiveMissionId ?? "");
    next =
      definition && definition.type !== "EXTERNAL"
        ? runInteractive(
            next,
            quest.id,
            wrongVocabulary && definition.type === "VOCABULARY",
          ).journey
        : applyJourneyAction(
            next,
            { type: "complete", questId: quest.id },
            now,
          ).journey;
  }
  return next;
}

test("new journeys start with a stable vocabulary inventory, not a skill score", () => {
  const learning = fresh().learning;
  assert.equal(learning.vocabulary.length, 5);
  assert.ok(learning.vocabulary.every((entry) => entry.mastery === "NEW"));
  assert.equal(learning.reviews.length, 0);
});

test("manual vocabulary import is normalized and idempotent", () => {
  const first = applyLearningAction(
    fresh(),
    {
      type: "importVocabulary",
      term: "  deploy   safely ",
      meaning: " release without unnecessary risk ",
      example: "We deploy safely.",
    },
    now,
  );
  const duplicate = applyLearningAction(
    first,
    {
      type: "importVocabulary",
      term: "DEPLOY SAFELY",
      meaning: "duplicate",
    },
    now,
  );
  assert.equal(first.learning.vocabulary.length, 6);
  assert.equal(duplicate.learning.vocabulary.length, 6);
  assert.equal(first.learning.vocabulary.at(-1).term, "deploy safely");
});

test("mission answers create one typed vocabulary review per step", () => {
  const first = applyMissionLearning(
    fresh(),
    attempt({ id: "attempt-1", correct: false }),
  );
  const duplicate = applyMissionLearning(
    first,
    attempt({ id: "attempt-1", correct: false }),
  );
  const word = duplicate.learning.vocabulary.find(
    (entry) => entry.id === "although",
  );
  assert.equal(duplicate.learning.reviews.length, 1);
  assert.equal(word.incorrectReviews, 1);
  assert.equal(word.mastery, "LEARNING");
  assert.equal(word.nextReviewDay, "2026-09-26");
  assert.equal(vocabularyIsWeak(word), true);
});

test("four correct reviews progress a word to MASTERED with a 30-day interval", () => {
  let state = fresh();
  for (let index = 0; index < 4; index++) {
    const day = `2026-09-${25 + index}`;
    state = applyMissionLearning(
      state,
      attempt({ id: `attempt-${index}`, day }),
    );
  }
  const word = state.learning.vocabulary.find(
    (entry) => entry.id === "although",
  );
  assert.equal(word.correctReviews, 4);
  assert.equal(word.correctStreak, 4);
  assert.equal(word.mastery, "MASTERED");
  assert.equal(word.intervalDays, 30);
  assert.equal(word.nextReviewDay, "2026-10-28");
});

test("manual sentence practice is recorded without pretending it was correct", () => {
  const state = applyMissionLearning(
    fresh(),
    attempt({
      id: "practice",
      missionId: "use-your-weapon",
      stepId: "use-improve",
      correct: null,
    }),
  );
  const word = state.learning.vocabulary.find(
    (entry) => entry.id === "improve",
  );
  assert.equal(state.learning.reviews[0].result, "PRACTICED");
  assert.equal(word.correctReviews, 0);
  assert.equal(word.incorrectReviews, 0);
  assert.equal(word.mastery, "LEARNING");
});

test("due and weak words prioritize the mission that can review them", () => {
  const state = applyMissionLearning(
    fresh(),
    attempt({ id: "weak-word", correct: false }),
  );
  assert.equal(
    recommendedVocabularyMissionIds(state.learning, "2026-09-26")[0],
    "memory-battle",
  );
  assert.equal(learningMetrics(state.learning, "2026-09-26").weak, 1);
  assert.equal(learningMetrics(state.learning, "2026-09-26").due, 1);
});

test("adaptive selection changes only future vocabulary slots", () => {
  const state = applyMissionLearning(
    fresh(),
    attempt({ id: "weak-word", correct: false }),
  );
  assert.deepEqual(questsForDay(1), fresh().quests);
  const next = questsForDay(4, state.learning, "2026-09-26");
  assert.ok(
    next.some((quest) => quest.interactiveMissionId === "memory-battle"),
  );
  assert.equal(next.length, 3);
  assert.equal(new Set(next.map((quest) => quest.interactiveMissionId)).size, 3);
});

test("real Vocabulary mission completion updates reviews, XP and session once", () => {
  let state = completeCurrentDay(fresh());
  state = completeCurrentDay(state);
  const quest = dailyQuests(state).find(
    (candidate) =>
      missionDefinition(candidate.interactiveMissionId ?? "")?.type ===
      "VOCABULARY",
  );
  const result = runInteractive(state, quest.id, true);
  const repeated = applyMissionAction(
    result.journey,
    { type: "complete", questId: quest.id, elapsedSeconds: 999 },
    now,
  );
  assert.equal(result.journey.learning.reviews.length, 2);
  assert.equal(repeated.journey, result.journey);
  assert.equal(
    result.journey.sessions.filter((session) => session.questId === quest.id)
      .length,
    1,
  );
  assert.equal(
    result.journey.xpRecords.filter(
      (record) => record.id === `quest:${quest.id}`,
    ).length,
    1,
  );
});

test("completed reviews influence the next Study Day without rewriting current quests", () => {
  let state = completeCurrentDay(fresh());
  state = completeCurrentDay(state);
  const currentIds = dailyQuests(state).map((quest) => quest.id);
  const vocabulary = dailyQuests(state).find(
    (quest) =>
      missionDefinition(quest.interactiveMissionId ?? "")?.type ===
      "VOCABULARY",
  );
  state = runInteractive(state, vocabulary.id, true).journey;
  for (const quest of dailyQuests(state).filter(
    (candidate) => candidate.status !== "completed",
  )) {
    const definition = missionDefinition(quest.interactiveMissionId ?? "");
    state =
      definition && definition.type !== "EXTERNAL"
        ? runInteractive(state, quest.id).journey
        : applyJourneyAction(
            state,
            { type: "complete", questId: quest.id },
            now,
          ).journey;
  }
  assert.deepEqual(
    state.quests
      .filter((quest) => quest.studyDay === 3)
      .map((quest) => quest.id),
    currentIds,
  );
  assert.ok(
    state.quests
      .filter((quest) => quest.studyDay === 4)
      .some((quest) => quest.interactiveMissionId === "memory-battle"),
  );
});

test("schema 4 migrates to schema 5 without losing permanent progress", async () => {
  const store = memory();
  const initial = await mockGameService.loadGame();
  const oldJourney = structuredClone(fresh());
  delete oldJourney.learning;
  await createMissionStorage(store).save(projectJourney(initial, oldJourney));
  const loaded = await createLearningStorage(store).load(initial);
  assert.equal(loaded.journey.level, oldJourney.level);
  assert.deepEqual(loaded.journey.sessions, oldJourney.sessions);
  assert.equal(loaded.journey.learning.vocabulary.length, 5);
  assert.equal(
    JSON.parse(store.values.get(LEARNING_STORAGE_KEY)).schemaVersion,
    LEARNING_SCHEMA_VERSION,
  );
  assert.ok(store.values.has(MISSION_STORAGE_KEY));
});

test("schema 5 restores imported words and rejects duplicate inventory IDs", async () => {
  const store = memory();
  const initial = await mockGameService.loadGame();
  const journey = applyLearningAction(
    fresh(),
    {
      type: "importVocabulary",
      term: "rollback",
      meaning: "undo a change",
    },
    now,
  );
  const storage = createLearningStorage(store);
  await storage.save(projectJourney(initial, journey));
  const loaded = await storage.load(initial);
  assert.ok(
    loaded.journey.learning.vocabulary.some(
      (entry) => entry.term === "rollback",
    ),
  );
  const envelope = JSON.parse(store.values.get(LEARNING_STORAGE_KEY));
  envelope.journey.learning.vocabulary.push(
    envelope.journey.learning.vocabulary[0],
  );
  const malformed = JSON.stringify(envelope);
  store.values.set(LEARNING_STORAGE_KEY, malformed);
  await assert.rejects(() => storage.load(initial));
  assert.equal(store.values.get(LEARNING_STORAGE_KEY), malformed);
});

test("schema 5 reopens an interrupted mission as PAUSED", async () => {
  const store = memory();
  const initial = await mockGameService.loadGame();
  const quest = dailyQuests(fresh())[0];
  const started = applyMissionAction(
    fresh(),
    { type: "start", questId: quest.id },
    now,
  ).journey;
  const storage = createLearningStorage(store);
  await storage.save(projectJourney(initial, started));
  const loaded = await storage.load(initial);
  assert.equal(loaded.journey.missions.active.status, "PAUSED");
  assert.equal(loaded.journey.learning.vocabulary.length, 5);
});

test("failed vocabulary writes do not publish imports and retry stays idempotent", async () => {
  const initial = projectJourney(await mockGameService.loadGame(), fresh());
  let fail = true;
  let persisted = null;
  const session = createGameSession(initial, {
    async load(snapshot) {
      return snapshot;
    },
    async save(snapshot) {
      if (fail) throw new Error("disk unavailable");
      persisted = snapshot;
    },
  });
  const action = {
    type: "importVocabulary",
    term: "idempotent",
    meaning: "safe to repeat",
  };
  await assert.rejects(() => session.learning(action, now));
  fail = false;
  const retried = await session.learning(action, now);
  assert.equal(retried.snapshot.journey.learning.vocabulary.length, 6);
  assert.equal(persisted.journey.learning.vocabulary.length, 6);
  const duplicate = await session.learning(action, now);
  assert.equal(duplicate.snapshot.journey.learning.vocabulary.length, 6);
});

test("reset clears the Learning Engine and a new journey gets a fresh inventory", () => {
  const imported = applyLearningAction(
    fresh(),
    {
      type: "importVocabulary",
      term: "release",
      meaning: "publish software",
    },
    now,
  );
  const reset = applyJourneyAction(
    imported,
    { type: "reset", confirmed: true },
    now,
  ).journey;
  assert.equal(reset.learning.vocabulary.length, 0);
  const restarted = applyJourneyAction(reset, { type: "start" }, now).journey;
  assert.equal(restarted.learning.vocabulary.length, 5);
  assert.equal(restarted.learning.reviews.length, 0);
});
