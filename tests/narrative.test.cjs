const assert = require("node:assert/strict");
const { test } = require("node:test");
const { startJourney } = require("../.game-check/journey/stateFactory");
const { applyJourneyAction } = require("../.game-check/journey/rules");
const { applyMissionAction } = require("../.game-check/missions/rules");
const { missionDefinition } = require("../.game-check/missions/content");
function completeThroughMission(state, questId, time) {
  const quest = state.quests.find((candidate) => candidate.id === questId);
  if (!quest?.interactiveMissionId)
    return applyJourneyAction(state, { type: "complete", questId }, time);
  let result = applyMissionAction(state, { type: "start", questId }, time);
  let next = result.journey;
  const definition = missionDefinition(quest.interactiveMissionId);
  let run = next.missions?.active;
  if (!definition || !run) return result;
  if (definition.type === "LISTENING") {
    result = applyMissionAction(next, { type: "audioPlayed", questId }, time);
    next = result.journey;
    run = next.missions.active;
  }
  while (run) {
    const step = definition.steps[run.currentStep];
    if (step.kind !== "PROMPT") {
      const value =
        step.kind === "MANUAL_PRACTICE"
          ? "Practice sentence"
          : step.correctOptionId;
      result = applyMissionAction(
        next,
        {
          type: "answer",
          questId,
          stepId: step.id,
          value,
          elapsedSeconds: definition.minimumActiveSeconds,
        },
        time,
      );
      next = result.journey;
      run = next.missions.active;
    }
    if (!run || run.currentStep === definition.steps.length - 1) break;
    result = applyMissionAction(
      next,
      {
        type: "advance",
        questId,
        stepId: step.id,
        elapsedSeconds: definition.minimumActiveSeconds,
      },
      time,
    );
    next = result.journey;
    run = next.missions.active;
  }
  return applyMissionAction(
    next,
    {
      type: "complete",
      questId,
      elapsedSeconds: definition.minimumActiveSeconds,
    },
    time,
  );
}

const {
  applyDeveloperAction,
} = require("../.game-check/journey/developerActions");
const {
  initialNarrative,
  migrateNarrative,
  unlockTitles,
  applyNarrativeAction,
  needsPrologue,
  validLocalRecordingReference,
} = require("../.game-check/journey/narrative/rules");
const {
  campaignState,
  currentChapter,
  chapterProgress,
  projectedCompletion,
} = require("../.game-check/journey/narrative/selectors");
const { CHAPTERS } = require("../.game-check/journey/narrative/config");
const { dailyQuests } = require("../.game-check/journey/selectors");
const { createGameSession } = require("../.game-check/domain/gameSession");
const { mockGameService } = require("../.game-check/services/gameService");
const { projectJourney } = require("../.game-check/journey/projectSnapshot");
const {
  createNarrativeStorage,
  NARRATIVE_STORAGE_KEY,
} = require("../.game-check/persistence/narrativeStorage");
const {
  createJourneyStorage,
  JOURNEY_STORAGE_KEY,
} = require("../.game-check/persistence/journeyStorage");
const clock = (day) => ({ day, instant: `${day}T15:00:00.000Z` });
const now = clock("2026-09-18");
const fresh = () => ({ ...startJourney(now), narrative: initialNarrative() });
const skip = (s) => applyNarrativeAction(s, { type: "skipPrologue" }, now);
function finishDay(s, time = now) {
  for (const q of dailyQuests(s))
    s = completeThroughMission(s, q.id, time).journey;
  return s;
}
function memory() {
  const values = new Map();
  const writes = [];
  return {
    values,
    writes,
    async getItem(k) {
      return values.get(k) ?? null;
    },
    async setItem(k, v) {
      values.set(k, v);
      writes.push(k);
    },
  };
}
const recording = {
  localRecordingReference: "Audio/recording-one.m4a",
  durationSeconds: 12.5,
};

test("Awakening is active while future campaigns stay locked", () => {
  assert.deepEqual(
    campaignState(fresh()).map((c) => c.status),
    ["ACTIVE", "LOCKED", "LOCKED"],
  );
  assert.equal(campaignState(fresh())[0].studyDays, 90);
});
test("campaign metadata preserves XP, level and permanent history", () => {
  const s = finishDay(skip(fresh()));
  const upgraded = migrateNarrative(s);
  assert.equal(upgraded.level, s.level);
  assert.equal(upgraded.totalXpEarned, s.totalXpEarned);
  assert.deepEqual(upgraded.sessions, s.sessions);
  assert.deepEqual(upgraded.achievements, s.achievements);
});
test("chapter progression is configured and does not depend on XP", () => {
  let s = skip(fresh());
  assert.equal(currentChapter(s).id, "the-return");
  assert.equal(chapterProgress(s).fraction, 0);
  for (let i = 0; i < 7; i++) s = finishDay(s);
  assert.equal(currentChapter(s).id, "finding-your-voice");
  assert.equal(chapterProgress(s).fraction, 0);
  assert.equal(chapterProgress(s, CHAPTERS[0]).fraction, 1);
  for (let i = 7; i < 14; i++) s = finishDay(s);
  assert.equal(currentChapter(s).id, "finding-your-voice");
  assert.equal(chapterProgress(s).fraction, 1);
  s.boss.defeatedAt = now.instant;
  assert.equal(currentChapter(s).id, "beyond-the-classroom");
});
test("level-five title unlock is timestamped from the XP ledger and idempotent", () => {
  let s = skip(fresh());
  for (let i = 0; i < 8; i++) s = finishDay(s);
  const title = s.narrative.titles.find((t) => t.id === "the-returner");
  assert.ok(title);
  assert.equal(title.unlockedAt, now.instant);
  assert.equal(unlockTitles(s), s);
  assert.equal(s.narrative.titles.filter((t) => t.id === title.id).length, 1);
});
test("Speaking title tracks minutes of effort, not a linguistic score", () => {
  let s = skip(fresh());
  for (let i = 0; i < 14; i++) s = finishDay(s);
  assert.ok(s.narrative.titles.some((t) => t.id === "voice-seeker"));
  assert.equal("skills" in s, false);
});
test("Silence Breaker title unlocks on boss defeat and remains permanent", () => {
  let s = skip(fresh());
  for (let i = 0; i < 14; i++) s = finishDay(s);
  for (const stepId of ["introduce", "day", "hobbies", "work", "final"])
    s = applyJourneyAction(s, { type: "bossStep", stepId }, now).journey;
  assert.ok(s.narrative.titles.some((t) => t.id === "silence-breaker"));
  assert.equal(unlockTitles(s), s);
});
test("unearned titles cannot be equipped; equipped title changes only presentation", () => {
  let s = skip(fresh());
  assert.equal(
    applyNarrativeAction(
      s,
      { type: "equipTitle", titleId: "the-returner" },
      now,
    ),
    s,
  );
  s = applyDeveloperAction(s, "unlockTitle", now, true).journey;
  const result = applyNarrativeAction(
    s,
    { type: "equipTitle", titleId: "the-returner" },
    now,
  );
  assert.equal(result.narrative.equippedTitleId, "the-returner");
  assert.equal(result.totalXpEarned, s.totalXpEarned);
  assert.equal(
    applyNarrativeAction(
      result,
      { type: "equipTitle", titleId: "the-returner" },
      now,
    ),
    result,
  );
  assert.equal(
    applyNarrativeAction(result, { type: "equipTitle", titleId: null }, now)
      .narrative.equippedTitleId,
    null,
  );
});
test("new prologue blocks real quests until saved or explicitly skipped", () => {
  const s = fresh();
  assert.ok(needsPrologue(s));
  const id = dailyQuests(s)[0].id;
  assert.equal(
    applyJourneyAction(s, { type: "complete", questId: id }, now).feedback,
    null,
  );
  assert.equal(
    applyJourneyAction(s, { type: "activate", questId: id }, now).feedback,
    null,
  );
  const continued = skip(s);
  assert.equal(needsPrologue(continued), false);
  assert.equal(
    completeThroughMission(continued, id, now).feedback.xpAwarded,
    20,
  );
});
test("saving the Prologue creates one local capsule without XP, minutes or scores", () => {
  const s = fresh();
  const saved = applyNarrativeAction(
    s,
    { type: "saveCapsule", recording },
    now,
  );
  assert.equal(saved.narrative.prologue.status, "saved");
  assert.equal(saved.narrative.timeCapsules[0].studyDay, 0);
  assert.equal(saved.narrative.timeCapsules[0].type, "prologue");
  assert.equal(saved.narrative.timeCapsules[0].durationSeconds, 12.5);
  assert.equal(saved.sessions.length, 0);
  assert.equal(saved.totalXpEarned, 0);
  assert.equal(needsPrologue(saved), false);
});
test("capsule save and prologue completion are idempotent", () => {
  const s = applyNarrativeAction(
    fresh(),
    { type: "saveCapsule", recording },
    now,
  );
  assert.equal(
    applyNarrativeAction(s, { type: "saveCapsule", recording }, now),
    s,
  );
  assert.equal(applyNarrativeAction(s, { type: "skipPrologue" }, now), s);
  const skipped = skip(fresh());
  assert.equal(
    applyNarrativeAction(skipped, { type: "skipPrologue" }, now),
    skipped,
  );
});
test("later capsules keep the original prologue and record the actual Study Day", () => {
  let s = applyNarrativeAction(
    fresh(),
    { type: "saveCapsule", recording },
    now,
  );
  s = finishDay(s);
  const later = applyNarrativeAction(
    s,
    {
      type: "saveCapsule",
      recording: { ...recording, localRecordingReference: "Audio/second.m4a" },
    },
    now,
  );
  assert.equal(later.narrative.timeCapsules.length, 2);
  assert.equal(later.narrative.timeCapsules[1].studyDay, 1);
  assert.equal(later.narrative.timeCapsules[1].type, "checkpoint");
  assert.equal(
    later.narrative.timeCapsules[0].localRecordingReference,
    recording.localRecordingReference,
  );
});
test("remote, traversing and invalid recording references are rejected", () => {
  for (const ref of [
    "https://host/audio",
    "../audio",
    "Audio/../audio",
    "file:///audio",
    "/audio",
    "Audio\\file",
    "Audio/a?url=1",
  ]) {
    assert.equal(validLocalRecordingReference(ref), false);
    assert.throws(() =>
      applyNarrativeAction(
        fresh(),
        {
          type: "saveCapsule",
          recording: { ...recording, localRecordingReference: ref },
        },
        now,
      ),
    );
  }
  for (const duration of [0, -1, NaN, Infinity, 3601])
    assert.throws(() =>
      applyNarrativeAction(
        fresh(),
        {
          type: "saveCapsule",
          recording: { ...recording, durationSeconds: duration },
        },
        now,
      ),
    );
});
test("projection waits for enough calendar observations", () => {
  assert.equal(projectedCompletion(fresh(), now.day).status, "building");
  let s = skip(fresh());
  for (let i = 0; i < 10; i++) s = finishDay(s);
  assert.equal(projectedCompletion(s, "2026-09-25").status, "building");
});
test("projection uses recent real Study Days rather than one day per calendar day", () => {
  let s = skip(fresh());
  for (const day of ["2026-09-18", "2026-09-21", "2026-09-25"])
    s = finishDay(s, clock(day));
  const estimate = projectedCompletion(s, "2026-09-25");
  assert.equal(estimate.status, "estimate");
  assert.equal(estimate.observedDays, 8);
  assert.equal(estimate.studyDaysCompleted, 3);
  assert.equal(estimate.weeksRemaining, 34);
});
test("projection changes with inactivity and eventually waits for fresh observations", () => {
  let s = skip(fresh());
  for (const day of ["2026-09-18", "2026-09-21", "2026-09-25"])
    s = finishDay(s, clock(day));
  const early = projectedCompletion(s, "2026-09-25");
  const later = projectedCompletion(s, "2026-09-28");
  assert.ok(later.weeksRemaining > early.weeksRemaining);
  assert.equal(projectedCompletion(s, "2026-10-20").status, "building");
  assert.equal(s.studyDays, 3);
});
test("multiple Study Days per calendar day are counted but require distinct dates", () => {
  let s = skip(fresh());
  for (const day of ["2026-09-18", "2026-09-18", "2026-09-21", "2026-09-25"])
    s = finishDay(s, clock(day));
  const estimate = projectedCompletion(s, "2026-09-25");
  assert.equal(estimate.studyDaysCompleted, 4);
  assert.equal(estimate.weeksRemaining, 25);
});
test("completed campaigns have no projected remainder", () => {
  const s = { ...fresh(), studyDays: 90 };
  assert.deepEqual(projectedCompletion(s, now.day), { status: "complete" });
});
test("quest feedback captures title, category and daily progress before next-day quests", () => {
  let s = skip(fresh());
  const qs = dailyQuests(s);
  const first = completeThroughMission(s, qs[0].id, now);
  assert.equal(first.feedback.questTitle, "Train Your Ears");
  assert.equal(first.feedback.category, "Listening");
  assert.equal(first.feedback.dailyCompleted, 1);
  s = first.journey;
  s = completeThroughMission(s, qs[1].id, now).journey;
  const last = completeThroughMission(s, qs[2].id, now);
  assert.equal(last.feedback.dailyCompleted, 3);
  assert.equal(last.feedback.chapterDay, 1);
  assert.equal(dailyQuests(last.journey)[0].studyDay, 2);
});
test("all narrative developer actions respect production gate", () => {
  const s = fresh();
  for (const action of [
    "completePrologue",
    "unlockTitle",
    "advanceChapter",
    "mockCapsule",
    "simulatePace",
  ])
    assert.equal(applyDeveloperAction(s, action, now, false).journey, s);
});
test("developer title and capsule are idempotent and clearly simulated", () => {
  let s = skip(fresh());
  s = applyDeveloperAction(s, "unlockTitle", now, true).journey;
  assert.equal(s.narrative.titles[0].source, "developer");
  assert.equal(s.developmentData, true);
  assert.equal(applyDeveloperAction(s, "unlockTitle", now, true).journey, s);
  s = applyDeveloperAction(s, "mockCapsule", now, true).journey;
  assert.equal(s.narrative.timeCapsules[0].type, "developer");
  assert.equal(s.narrative.timeCapsules[0].localRecordingReference, null);
  assert.equal(applyDeveloperAction(s, "mockCapsule", now, true).journey, s);
});
test("developer pace simulation records actual domain completions without rewriting history", () => {
  const s = skip(fresh());
  const result = applyDeveloperAction(
    s,
    "simulatePace",
    clock("2026-09-25"),
    true,
  ).journey;
  assert.equal(result.studyDays, 3);
  assert.equal(new Set(result.completedDays.map((d) => d.calendarDay)).size, 3);
  assert.equal(projectedCompletion(result, "2026-09-25").status, "estimate");
  assert.equal(s.completedDays.length, 0);
});
test("schema2 migration preserves all progress and does not force a legacy prologue", async () => {
  const m = memory();
  const initial = await mockGameService.loadGame();
  let old = startJourney(now);
  for (let i = 0; i < 8; i++) old = finishDay(old);
  await createJourneyStorage(m).save(projectJourney(initial, old));
  const original = m.values.get(JOURNEY_STORAGE_KEY);
  const storage = createNarrativeStorage(m);
  const loaded = await storage.load(initial);
  assert.equal(loaded.journey.narrative.prologue.status, "legacy");
  assert.ok(
    loaded.journey.narrative.titles.some((t) => t.id === "the-returner"),
  );
  assert.equal(loaded.journey.totalXpEarned, old.totalXpEarned);
  assert.deepEqual(loaded.journey.sessions, old.sessions);
  assert.deepEqual(loaded.journey.completedDays, old.completedDays);
  assert.equal(m.values.get(JOURNEY_STORAGE_KEY), original);
  assert.equal(
    JSON.parse(m.values.get(NARRATIVE_STORAGE_KEY)).schemaVersion,
    3,
  );
});
test("fresh session starts with pending Prologue and never repeats start after reopening", async () => {
  const m = memory();
  const initial = await mockGameService.loadGame();
  const storage = createNarrativeStorage(m);
  const session = createGameSession(initial, storage);
  await session.journey({ type: "start" }, now);
  const loaded = await storage.load(initial);
  assert.equal(loaded.journey.narrative.prologue.status, "pending");
  const resumed = createGameSession(loaded, storage);
  const before = m.writes.length;
  await resumed.journey({ type: "start" }, clock("2026-09-19"));
  assert.equal(m.writes.length, before);
});
test("schema3 restores equipped titles and capsule metadata without losing history", async () => {
  const m = memory();
  const storage = createNarrativeStorage(m);
  const initial = await mockGameService.loadGame();
  let s = applyNarrativeAction(
    fresh(),
    { type: "saveCapsule", recording },
    now,
  );
  s = applyDeveloperAction(s, "unlockTitle", now, true).journey;
  s = applyNarrativeAction(
    s,
    { type: "equipTitle", titleId: "the-returner" },
    now,
  );
  await storage.save(projectJourney(initial, s));
  const loaded = await storage.load(initial);
  assert.deepEqual(loaded.journey, s);
  assert.equal(loaded.player.title, "THE RETURNER");
});
test("unsupported or invalid narrative saves preserve both new and old records", async () => {
  const initial = await mockGameService.loadGame();
  for (const mutate of [
    (e) => (e.schemaVersion = 99),
    (e) =>
      e.journey.narrative.timeCapsules.push({
        id: "x",
        createdAt: now.instant,
        studyDay: 0,
        prompt: "x",
        type: "prologue",
        durationSeconds: 1,
        localRecordingReference: "https://host/audio",
      }),
    (e) => (e.journey.narrative.equippedTitleId = "missing"),
  ]) {
    const m = memory();
    const e = { schemaVersion: 3, journey: fresh() };
    mutate(e);
    const raw = JSON.stringify(e);
    m.values.set(NARRATIVE_STORAGE_KEY, raw);
    m.values.set(JOURNEY_STORAGE_KEY, "backup");
    await assert.rejects(() => createNarrativeStorage(m).load(initial));
    assert.equal(m.values.get(NARRATIVE_STORAGE_KEY), raw);
    assert.equal(m.values.get(JOURNEY_STORAGE_KEY), "backup");
    assert.equal(m.writes.length, 0);
  }
});
test("simultaneous capsule saves create one record and persist once", async () => {
  const m = memory();
  const initial = await mockGameService.loadGame();
  const session = createGameSession(
    projectJourney(initial, fresh()),
    createNarrativeStorage(m),
  );
  const results = await Promise.all([
    session.narrative({ type: "saveCapsule", recording }, now),
    session.narrative({ type: "saveCapsule", recording }, now),
  ]);
  assert.equal(results[1].snapshot.journey.narrative.timeCapsules.length, 1);
  assert.equal(m.writes.length, 1);
});
test("failed capsule save keeps Prologue pending and retry succeeds once", async () => {
  const m = memory();
  let fail = true;
  const adapter = {
    getItem: m.getItem,
    async setItem(k, v) {
      if (fail) {
        fail = false;
        throw Error("disk full");
      }
      await m.setItem(k, v);
    },
  };
  const session = createGameSession(
    projectJourney(await mockGameService.loadGame(), fresh()),
    createNarrativeStorage(adapter),
  );
  await assert.rejects(() =>
    session.narrative({ type: "saveCapsule", recording }, now),
  );
  const result = await session.narrative(
    { type: "saveCapsule", recording },
    now,
  );
  assert.equal(result.snapshot.journey.narrative.prologue.status, "saved");
  assert.equal(m.writes.length, 1);
});

const {
  recordingReference,
} = require("../.game-check/services/recordingReference");
test("document recording references survive a different iOS sandbox root", () => {
  const ref = recordingReference(
    "file:///old/Documents/Audio/one.m4a",
    "file:///old/Documents/",
  );
  assert.equal(ref, "Audio/one.m4a");
  assert.equal(
    recordingReference("file:///new/Documents/" + ref, "file:///new/Documents"),
    ref,
  );
});
test("recording references reject cache, remote and sibling directories", () => {
  for (const uri of [
    "file:///app/cache/one.m4a",
    "https://host/audio",
    "file:///app/DocumentsOther/one.m4a",
    "file:///app/Documents/Audio/%2e%2e/one.m4a",
  ])
    assert.throws(() => recordingReference(uri, "file:///app/Documents"));
});
test("pending or future capsule history cannot silently replace a save", async () => {
  const initial = await mockGameService.loadGame();
  for (const mutate of [
    (s) => {
      s.narrative.prologue.status = "pending";
      s.narrative.prologue.completedAt = null;
    },
    (s) =>
      s.narrative.timeCapsules.push({
        id: "future",
        createdAt: now.instant,
        studyDay: 90,
        prompt: "x",
        type: "developer",
        durationSeconds: 0,
        localRecordingReference: null,
      }),
  ]) {
    const m = memory();
    const s = finishDay(skip(fresh()));
    mutate(s);
    const raw = JSON.stringify({ schemaVersion: 3, journey: s });
    m.values.set(NARRATIVE_STORAGE_KEY, raw);
    await assert.rejects(() => createNarrativeStorage(m).load(initial));
    assert.equal(m.values.get(NARRATIVE_STORAGE_KEY), raw);
    assert.equal(m.writes.length, 0);
  }
});
test("confirmed reset clears narrative intentionally, cancellation preserves everything", async () => {
  const m = memory();
  let s = applyNarrativeAction(
    fresh(),
    { type: "saveCapsule", recording },
    now,
  );
  s = applyDeveloperAction(s, "unlockTitle", now, true).journey;
  const initial = await mockGameService.loadGame();
  const session = createGameSession(
    projectJourney(initial, s),
    createNarrativeStorage(m),
  );
  assert.deepEqual(
    (await session.journey({ type: "reset", confirmed: false }, now)).snapshot
      .journey,
    s,
  );
  const reset = await session.journey({ type: "reset", confirmed: true }, now);
  assert.equal(reset.snapshot.journey.startedAt, null);
  const reopened = await createNarrativeStorage(m).load(initial);
  assert.equal(reopened.journey.narrative.titles.length, 0);
  assert.equal(reopened.journey.narrative.timeCapsules.length, 0);
  const started = await session.journey({ type: "start" }, now);
  assert.equal(started.snapshot.journey.narrative.prologue.status, "pending");
});

test("real quest completion announces earned titles once at Speaking and level milestones", () => {
  let s = skip(fresh());
  const announced = [];
  let last;
  for (let day = 0; day < 14; day++) {
    for (const quest of dailyQuests(s)) {
      last = completeThroughMission(s, quest.id, now);
      announced.push(...(last.feedback?.titleIds ?? []));
      s = last.journey;
    }
  }
  assert.deepEqual(announced.sort(), ["the-returner", "voice-seeker"]);
  assert.equal(last.feedback.dayComplete, 14);
  const duplicate = completeThroughMission(
    last.journey,
    last.feedback.questId,
    now,
  );
  assert.equal(duplicate.feedback, null);
  assert.deepEqual(
    duplicate.journey.narrative.titles,
    last.journey.narrative.titles,
  );
});
