const {
  applyDeveloperAction,
} = require("../.game-check/journey/developerActions");
const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  emptyJourney,
  applyJourneyAction,
  questsForDay,
  refreshJourney,
} = require("../.game-check/journey/rules");
const {
  awardXp,
  xpRequiredForLevel,
  totalEngagementXp,
} = require("../.game-check/domain/progression");
const calendar = require("../.game-check/journey/calendar");
const {
  refreshWeeklyTokens,
  protectRestDay,
  comebackStatus,
} = require("../.game-check/journey/consistency");
const {
  dailyQuests,
  bossHp,
  worldStatus,
  currentWorld,
  effortMetrics,
} = require("../.game-check/journey/selectors");
const { SILENCE, WORLDS, CAMPAIGN } = require("../.game-check/journey/config");
const {
  createJourneyStorage,
  JOURNEY_STORAGE_KEY,
} = require("../.game-check/persistence/journeyStorage");
const {
  PROGRESS_STORAGE_KEY,
  createProgressStorage,
} = require("../.game-check/persistence/progressStorage");
const { mockGameService } = require("../.game-check/services/gameService");
const { projectJourney } = require("../.game-check/journey/projectSnapshot");
const { createGameSession } = require("../.game-check/domain/gameSession");
const clock = (day) => ({ day, instant: `${day}T15:00:00.000Z` });
const first = clock("2026-09-17");
const start = (now) =>
  applyJourneyAction(emptyJourney(), { type: "start" }, now || first).journey;
const complete = (s, id, now = first) =>
  applyJourneyAction(s, { type: "complete", questId: id }, now);
function day(s, now = first) {
  for (const q of dailyQuests(s)) s = complete(s, q.id, now).journey;
  return s;
}
function world(now = first) {
  let s = start(now);
  for (let i = 0; i < SILENCE.unlockStudyDays; i++) s = day(s, now);
  return s;
}
function defeat(s, now = first) {
  for (const step of SILENCE.steps)
    s = applyJourneyAction(
      s,
      { type: "bossStep", stepId: step.id },
      now,
    ).journey;
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

test("journey starts explicitly at LV1, 0/100, day0, no achievements and two tokens", () => {
  const empty = emptyJourney();
  assert.equal(empty.startedAt, null);
  assert.equal(empty.quests.length, 0);
  const s = start();
  assert.equal(s.level, 1);
  assert.equal(s.xp, 0);
  assert.equal(s.studyDays, 0);
  assert.equal(s.streak, 0);
  assert.equal(s.restTokens, 2);
  assert.equal(currentWorld(s).name, "THE COMEBACK");
  assert.equal(effortMetrics(s).achievements, 0);
  assert.equal(dailyQuests(s).length, 3);
  assert.equal(
    applyJourneyAction(s, { type: "start" }, clock("2026-09-18")).journey,
    s,
  );
});
test("unstarted journey cannot earn XP or boss damage", () => {
  const s = emptyJourney();
  assert.equal(complete(s, "day-1:speak-up").journey, s);
  assert.equal(
    applyJourneyAction(s, { type: "bossStep", stepId: "introduce" }, first)
      .journey,
    s,
  );
});
test("official XP curve is centralized across levels", () => {
  assert.deepEqual([1, 2, 3, 4].map(xpRequiredForLevel), [100, 125, 150, 175]);
});
test("official level up exact threshold and overflow", () => {
  assert.deepEqual(awardXp(1, 80, 20), { level: 2, xp: 0, levelsGained: 1 });
  assert.deepEqual(awardXp(3, 140, 30), { level: 4, xp: 20, levelsGained: 1 });
});
test("multiple official levels preserve total XP and invalid inputs reject", () => {
  const result = awardXp(1, 0, 400);
  assert.equal(totalEngagementXp(result.level, result.xp), 400);
  for (const value of [-1, NaN, Infinity, 1.5])
    assert.throws(() => awardXp(1, 0, value));
});
test("worlds cover ninety Study Days without gaps", () => {
  assert.equal(WORLDS.length, 5);
  assert.equal(WORLDS[0].start, 1);
  assert.equal(WORLDS.at(-1).end, CAMPAIGN.studyDays);
  for (let i = 1; i < WORLDS.length; i++)
    assert.equal(WORLDS[i].start, WORLDS[i - 1].end + 1);
});
test("daily selection is deterministic, varied and non-duplicating", () => {
  for (let i = 1; i <= 14; i++) {
    const qs = questsForDay(i);
    assert.equal(qs.length, 3);
    assert.equal(new Set(qs.map((q) => q.templateId)).size, 3);
    assert.deepEqual(qs, questsForDay(i));
    assert.ok(qs.every((q) => q.studyDay === i));
  }
  assert.notDeepEqual(
    questsForDay(1).map((q) => q.templateId),
    questsForDay(2).map((q) => q.templateId),
  );
  assert.deepEqual(questsForDay(15), []);
});
test("quest completion records effort once without mutating input", () => {
  const s = start();
  const old = structuredClone(s);
  const id = dailyQuests(s)[0].id;
  const result = complete(s, id);
  assert.deepEqual(s, old);
  assert.equal(result.journey.xp, 20);
  assert.equal(result.journey.sessions.length, 1);
  assert.equal(result.journey.sessions[0].durationMinutes, 10);
  assert.equal(result.journey.quests[0].completedAt, first.instant);
  const duplicate = complete(result.journey, id);
  assert.equal(duplicate.feedback, null);
  assert.deepEqual(duplicate.journey, result.journey);
});
test("locked or missing quests cannot grant reward", () => {
  const s = start();
  s.quests[0].status = "locked";
  for (const id of [s.quests[0].id, "missing"])
    assert.equal(complete(s, id).feedback, null);
});
test("lesson goals do not invent study minutes", () => {
  const s = start();
  const lesson = dailyQuests(s).find((q) => q.durationMinutes === null);
  const result = complete(s, lesson.id).journey;
  assert.equal(result.xp, 10);
  assert.equal(result.sessions.length, 0);
  assert.equal(effortMetrics(result).questsCompleted, 1);
});
test("three main quests grant exactly one daily bonus and one Study Day", () => {
  let s = start();
  const ids = dailyQuests(s).map((q) => q.id);
  s = complete(s, ids[0]).journey;
  s = complete(s, ids[1]).journey;
  assert.equal(s.studyDays, 0);
  const final = complete(s, ids[2]);
  s = final.journey;
  assert.equal(s.totalXpEarned, 70);
  assert.equal(final.feedback.xpAwarded, 30);
  assert.equal(final.feedback.dayComplete, 1);
  assert.equal(s.studyDays, 1);
  assert.equal(s.completedDays.length, 1);
  assert.equal(s.xpRecords.filter((x) => x.source === "day").length, 1);
  for (const id of ids) s = complete(s, id).journey;
  assert.equal(s.studyDays, 1);
  assert.equal(s.totalXpEarned, 70);
  assert.equal(dailyQuests(s)[0].studyDay, 2);
});
test("calendar inactivity never advances Study Days or reduces XP", () => {
  const s = day(start());
  const later = refreshJourney(s, clock("2026-10-17"));
  assert.equal(later.studyDays, 1);
  assert.equal(later.totalXpEarned, s.totalXpEarned);
  assert.equal(later.level, s.level);
});
test("two Study Days in the same calendar day only increment streak once", () => {
  const s = day(day(start()));
  assert.equal(s.studyDays, 2);
  assert.equal(s.streak, 1);
  assert.equal(s.restTokens, 2);
});
test("consecutive calendar Study Days increment streak", () => {
  let s = day(start());
  s = day(s, clock("2026-09-18"));
  assert.equal(s.streak, 2);
  assert.equal(s.restTokens, 2);
});
test("partial studying records activity but does not advance consistency streak", () => {
  let s = day(start());
  s = complete(s, dailyQuests(s)[0].id, clock("2026-09-18")).journey;
  assert.equal(s.streak, 1);
  assert.equal(s.studyDays, 1);
  assert.equal(s.lastActivityDay, "2026-09-18");
});
test("one rest day consumes a token without XP or Journey advancement", () => {
  const s = day(start());
  const later = refreshJourney(s, clock("2026-09-19"));
  assert.equal(later.restTokens, 1);
  assert.equal(later.streak, 1);
  assert.equal(later.xp, s.xp);
  assert.equal(later.studyDays, 1);
  assert.deepEqual(refreshJourney(later, clock("2026-09-19")), later);
  const back = day(later, clock("2026-09-19"));
  assert.equal(back.streak, 2);
});
test("exhausted rest tokens end streak while retaining permanent progress", () => {
  const s = day(start(clock("2026-09-14")), clock("2026-09-14"));
  const later = refreshJourney(s, clock("2026-09-18"));
  assert.equal(later.restTokens, 0);
  assert.equal(later.streak, 0);
  assert.equal(later.totalXpEarned, 70);
  assert.equal(
    later.achievements.find((a) => a.id === "first-step").unlocked,
    true,
  );
});
test("rest behavior and weekly refresh are pure and bounded", () => {
  assert.deepEqual(protectRestDay(4, 1), { streak: 4, tokens: 0 });
  assert.deepEqual(protectRestDay(4, 0), { streak: 0, tokens: 0 });
  assert.deepEqual(protectRestDay(0, 2), { streak: 0, tokens: 2 });
  assert.equal(refreshWeeklyTokens(1, "2026-09-14", "2026-09-21").tokens, 3);
  assert.equal(refreshWeeklyTokens(3, "2026-09-14", "2026-10-05").tokens, 4);
});
test("weekly token grant is not duplicated on reopen", () => {
  const s = start(clock("2026-09-14"));
  const later = refreshJourney(s, clock("2026-09-21"));
  assert.equal(later.restTokens, 4);
  assert.deepEqual(refreshJourney(later, clock("2026-09-21")), later);
});
test("rest settlement is independent of opening frequency", () => {
  const now = clock("2026-09-14");
  const s = day(start(now), now);
  const once = refreshJourney(s, clock("2026-09-24"));
  let often = s;
  for (let i = 1; i <= 10; i++)
    often = refreshJourney(often, clock(calendar.addCalendarDays(now.day, i)));
  assert.deepEqual(once, often);
});
test("calendar comparisons, leap days and Monday week boundaries are safe", () => {
  assert.ok(calendar.sameCalendarDay("2026-09-17", "2026-09-17"));
  assert.ok(calendar.consecutiveCalendarDay("2024-02-29", "2024-03-01"));
  assert.equal(calendar.inactivityDays("2026-12-31", "2027-01-02"), 2);
  assert.equal(calendar.weekStart("2026-09-20"), "2026-09-14");
  assert.equal(calendar.weekStart("2026-09-21"), "2026-09-21");
  assert.throws(() => calendar.calendarOrdinal("2026-02-30"));
  assert.equal(calendar.streakEligible("2026-09-17", "2026-09-17"), false);
});
test("local calendar date is distinct from UTC timestamp", () => {
  const previous = process.env.TZ;
  try {
    process.env.TZ = "America/Fortaleza";
    const now = calendar.clockFromDate(new Date("2026-09-18T01:00:00.000Z"));
    assert.equal(now.day, "2026-09-17");
    assert.equal(now.instant, "2026-09-18T01:00:00.000Z");
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
test("DST does not change calendar-day distance", () => {
  const previous = process.env.TZ;
  try {
    process.env.TZ = "America/New_York";
    const a = calendar.clockFromDate(new Date("2026-03-08T06:00:00.000Z"));
    const b = calendar.clockFromDate(new Date("2026-03-09T05:00:00.000Z"));
    assert.equal(calendar.inactivityDays(a.day, b.day), 1);
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
test("clock moving backward never regresses Journey or consumes tokens", () => {
  const s = day(start());
  assert.equal(refreshJourney(s, clock("2026-09-16")), s);
  assert.equal(
    complete(s, dailyQuests(s)[0].id, clock("2026-09-16")).journey,
    s,
  );
});
test("comeback thresholds are supportive and deterministic", () => {
  assert.deepEqual([1, 2, 3, 6, 7].map(comebackStatus), [
    "NORMAL",
    "WELCOME_BACK",
    "COMEBACK_MODE",
    "COMEBACK_MODE",
    "COMEBACK_MODE",
  ]);
});
test("seven inactive days create one Return Quest per absence", () => {
  let s = refreshJourney(start(), clock("2026-09-24"));
  assert.equal(s.comeback, "COMEBACK_MODE");
  assert.equal(s.quests.filter((q) => q.kind === "return").length, 1);
  s = refreshJourney(s, clock("2026-09-25"));
  assert.equal(s.quests.filter((q) => q.kind === "return").length, 1);
  const q = s.quests.find((q) => q.kind === "return");
  const result = complete(s, q.id, clock("2026-09-25"));
  s = result.journey;
  assert.equal(s.totalXpEarned, 20);
  assert.equal(s.studyDays, 0);
  assert.equal(s.streak, 0);
  assert.equal(s.comeback, "NORMAL");
  assert.equal(complete(s, q.id, clock("2026-09-25")).feedback, null);
  s = refreshJourney(s, clock("2026-10-02"));
  assert.equal(s.quests.filter((q) => q.kind === "return").length, 2);
});
test("boss is locked until all fourteen Study Days are complete", () => {
  let s = start();
  assert.equal(bossHp(s), 100);
  assert.equal(
    applyJourneyAction(s, { type: "bossStep", stepId: "introduce" }, first)
      .feedback,
    null,
  );
  for (let i = 0; i < 13; i++) s = day(s);
  assert.equal(
    applyJourneyAction(s, { type: "bossStep", stepId: "introduce" }, first)
      .feedback,
    null,
  );
  s = day(s);
  assert.equal(s.studyDays, 14);
  assert.equal(dailyQuests(s).length, 0);
  assert.equal(
    bossHp(
      applyJourneyAction(s, { type: "bossStep", stepId: "introduce" }, first)
        .journey,
    ),
    80,
  );
});
test("each boss step damages only once and must follow the sequence", () => {
  let s = world();
  assert.equal(
    applyJourneyAction(s, { type: "bossStep", stepId: "final" }, first)
      .feedback,
    null,
  );
  let hp = 100;
  for (const step of SILENCE.steps) {
    s = applyJourneyAction(
      s,
      { type: "bossStep", stepId: step.id },
      first,
    ).journey;
    hp -= 20;
    assert.equal(bossHp(s), hp);
    const duplicate = applyJourneyAction(
      s,
      { type: "bossStep", stepId: step.id },
      first,
    );
    assert.equal(duplicate.feedback, null);
    assert.equal(bossHp(duplicate.journey), hp);
  }
  assert.equal(s.sessions.filter((x) => x.source === "boss").length, 5);
});
test("boss victory grants 150 XP and world unlock once", () => {
  const s = world();
  const won = defeat(s);
  assert.equal(won.totalXpEarned - s.totalXpEarned, 150);
  assert.equal(worldStatus(won, "the-comeback"), "COMPLETED");
  assert.equal(worldStatus(won, "find-your-voice"), "UNLOCKED");
  assert.equal(worldStatus(won, "into-the-wild"), "LOCKED");
  assert.equal(currentWorld(won).number, 2);
  assert.deepEqual(defeat(won), won);
  assert.equal(won.xpRecords.filter((x) => x.source === "boss").length, 1);
});
test("first-step, day, time and boss achievements unlock only once", () => {
  let s = world();
  for (const id of ["first-step", "on-fire", "speak-up", "all-ears"])
    assert.ok(s.achievements.find((a) => a.id === id).unlocked);
  const firstUnlock = s.achievements.find(
    (a) => a.id === "first-step",
  ).unlockedAt;
  s = defeat(s);
  for (const id of ["boss-slayer", "i-found-my-voice"])
    assert.ok(s.achievements.find((a) => a.id === id).unlocked);
  assert.equal(
    s.achievements.find((a) => a.id === "first-step").unlockedAt,
    firstUnlock,
  );
  assert.equal(s.achievements.filter((a) => a.unlocked).length, 6);
  assert.equal(s.achievements.find((a) => a.id === "scholar").unlocked, false);
});
test("Scholar unlocks after fifty quest records including return quests", () => {
  let s = world();
  for (let i = 1; i <= 8; i++) {
    const now = clock(calendar.addCalendarDays(first.day, i * 7));
    s = refreshJourney(s, now);
    const q = s.quests.find(
      (q) => q.kind === "return" && q.status !== "completed",
    );
    s = complete(s, q.id, now).journey;
  }
  assert.equal(effortMetrics(s).questsCompleted, 50);
  assert.ok(s.achievements.find((a) => a.id === "scholar").unlocked);
});
test("effort metrics sum records and support last seven days without skill scores", () => {
  let s = day(start());
  s = day(s, clock("2026-09-25"));
  const all = effortMetrics(s);
  assert.equal(all.totalMinutes, 33);
  assert.equal(all.minutesByCategory.Speaking, 8);
  assert.equal(all.questsCompleted, 6);
  assert.equal(effortMetrics(s, "2026-09-25", 7).totalMinutes, 18);
  assert.equal(all.minutesByCategory.Reading, 0);
  assert.equal("skillScore" in all, false);
});
test("reset requires explicit confirmation and returns to unstarted state", () => {
  const s = defeat(world());
  assert.equal(
    applyJourneyAction(s, { type: "reset", confirmed: false }, first).journey,
    s,
  );
  const reset = applyJourneyAction(
    s,
    { type: "reset", confirmed: true },
    first,
  ).journey;
  assert.deepEqual(reset, emptyJourney());
  assert.equal(start().studyDays, 0);
});
test("developer actions cannot run without the environment gate", () => {
  const s = start();
  for (const action of [
    "advanceDay",
    "addXp",
    "unlockBoss",
    "addToken",
    "removeToken",
    "inactivity",
  ])
    assert.equal(applyDeveloperAction(s, action, first, false).journey, s);
});
test("developer acceleration exercises the real domain and marks test records", () => {
  const s = applyDeveloperAction(start(), "unlockBoss", first, true).journey;
  assert.equal(s.studyDays, 14);
  assert.equal(s.quests.filter((q) => q.status === "completed").length, 42);
  assert.equal(s.developmentData, true);
  assert.equal(s.xpRecords.filter((x) => x.source === "day").length, 14);
  assert.equal(bossHp(s), 100);
});
test("schema1 migration preserves the demo record and does not start real journey", async () => {
  const m = memory();
  const legacy = createProgressStorage(m);
  await legacy.save(await mockGameService.loadGame());
  const old = m.values.get(PROGRESS_STORAGE_KEY);
  const storage = createJourneyStorage(m);
  const loaded = await storage.load(await mockGameService.loadGame());
  assert.equal(loaded.player.xp, 420);
  assert.equal(loaded.journey, undefined);
  const session = createGameSession(loaded, storage);
  await session.journey({ type: "start" }, first);
  assert.equal(m.values.get(PROGRESS_STORAGE_KEY), old);
  const reopened = await storage.load(await mockGameService.loadGame());
  assert.equal(reopened.journey.level, 1);
  assert.equal(reopened.journey.totalXpEarned, 0);
  assert.equal(JSON.parse(m.values.get(JOURNEY_STORAGE_KEY)).schemaVersion, 2);
});
test("missing storage uses safe demo defaults without deleting or writing anything", async () => {
  const m = memory();
  const loaded = await createJourneyStorage(m).load(
    await mockGameService.loadGame(),
  );
  assert.equal(loaded.journey, undefined);
  assert.equal(m.writes.length, 0);
});
test("full schema2 restores quests, history, tokens, boss and achievements", async () => {
  const m = memory();
  const storage = createJourneyStorage(m);
  const initial = await mockGameService.loadGame();
  const s = defeat(world());
  await storage.save(projectJourney(initial, s));
  const loaded = await storage.load(await mockGameService.loadGame());
  assert.deepEqual(loaded.journey, s);
  assert.equal(loaded.world.number, 2);
  assert.equal(loaded.player.xp, s.xp);
});
test("partial active quests and boss HP survive reopening without repeated reward", async () => {
  const m = memory();
  const storage = createJourneyStorage(m);
  const initial = await mockGameService.loadGame();
  let s = world();
  s = applyJourneyAction(
    s,
    { type: "bossStep", stepId: "introduce" },
    first,
  ).journey;
  await storage.save(projectJourney(initial, s));
  const loaded = await storage.load(initial);
  assert.equal(bossHp(loaded.journey), 80);
  const session = createGameSession(loaded, storage);
  const duplicate = await session.journey(
    { type: "bossStep", stepId: "introduce" },
    first,
  );
  assert.equal(duplicate.feedback, null);
  assert.equal(m.writes.length, 1);
});
test("malformed or future schemas do not silently overwrite progress", async () => {
  for (const raw of [
    "{",
    JSON.stringify({ schemaVersion: 99, journey: start() }),
  ]) {
    const m = memory();
    m.values.set(JOURNEY_STORAGE_KEY, raw);
    await assert.rejects(() =>
      mockGameService
        .loadGame()
        .then((initial) => createJourneyStorage(m).load(initial)),
    );
    assert.equal(m.values.get(JOURNEY_STORAGE_KEY), raw);
    assert.equal(m.writes.length, 0);
  }
});
test("invalid duplicate, XP and completed-day state are rejected", async () => {
  for (const edit of [
    (s) => s.xp++,
    (s) => s.quests.push(s.quests[0]),
    (s) => (s.completedDays[0].studyDay = 2),
    (s) => s.sessions.push(s.sessions[0]),
    (s) => (s.restTokens = 5),
  ]) {
    const m = memory();
    const s = day(start());
    edit(s);
    m.values.set(
      JOURNEY_STORAGE_KEY,
      JSON.stringify({ schemaVersion: 2, journey: s }),
    );
    await assert.rejects(() =>
      mockGameService
        .loadGame()
        .then((initial) => createJourneyStorage(m).load(initial)),
    );
    assert.equal(m.writes.length, 0);
  }
});
test("new optional schema fields receive defaults without losing recorded progress", async () => {
  const m = memory();
  const s = day(start());
  delete s.developmentData;
  m.values.set(
    JOURNEY_STORAGE_KEY,
    JSON.stringify({ schemaVersion: 2, journey: s }),
  );
  const loaded = await createJourneyStorage(m).load(
    await mockGameService.loadGame(),
  );
  assert.equal(loaded.journey.developmentData, false);
  assert.equal(loaded.journey.studyDays, 1);
  assert.equal(loaded.journey.totalXpEarned, 70);
});
test("simultaneous third-quest completions persist one bonus, session and Study Day", async () => {
  const m = memory();
  const storage = createJourneyStorage(m);
  let s = start();
  const qs = dailyQuests(s);
  s = complete(s, qs[0].id).journey;
  s = complete(s, qs[1].id).journey;
  const session = createGameSession(
    projectJourney(await mockGameService.loadGame(), s),
    storage,
  );
  const results = await Promise.all([
    session.completeQuest(qs[2].id, first),
    session.completeQuest(qs[2].id, first),
  ]);
  assert.equal(results[0].feedback.dayComplete, 1);
  assert.equal(results[1].feedback, null);
  assert.equal(results[1].snapshot.journey.studyDays, 1);
  assert.equal(results[1].snapshot.journey.totalXpEarned, 70);
  assert.equal(m.writes.length, 1);
});
test("simultaneous final boss steps persist one victory and achievement set", async () => {
  const m = memory();
  let s = world();
  for (const step of SILENCE.steps.slice(0, -1))
    s = applyJourneyAction(
      s,
      { type: "bossStep", stepId: step.id },
      first,
    ).journey;
  const session = createGameSession(
    projectJourney(await mockGameService.loadGame(), s),
    createJourneyStorage(m),
  );
  const results = await Promise.all([
    session.journey({ type: "bossStep", stepId: "final" }, first),
    session.journey({ type: "bossStep", stepId: "final" }, first),
  ]);
  assert.equal(results[0].feedback.xpAwarded, 150);
  assert.equal(results[1].feedback, null);
  assert.equal(m.writes.length, 1);
  assert.equal(results[1].snapshot.journey.boss.completedSteps.length, 5);
});
test("failed real-journey writes do not publish rewards and retry remains idempotent", async () => {
  const m = memory();
  let fail = true;
  const adapter = {
    getItem: m.getItem,
    async setItem(k, v) {
      if (fail) {
        fail = false;
        throw Error("write failed");
      }
      await m.setItem(k, v);
    },
  };
  const session = createGameSession(
    projectJourney(await mockGameService.loadGame(), start()),
    createJourneyStorage(adapter),
  );
  const id = "day-1:train-your-ears";
  await assert.rejects(() => session.completeQuest(id, first));
  assert.equal(m.writes.length, 0);
  const result = await session.completeQuest(id, first);
  assert.equal(result.snapshot.player.xp, 20);
  assert.equal((await session.completeQuest(id, first)).feedback, null);
  assert.equal(m.writes.length, 1);
});
test("confirmed reset persists and does not restore demo XP on reopen", async () => {
  const m = memory();
  const storage = createJourneyStorage(m);
  const session = createGameSession(
    projectJourney(await mockGameService.loadGame(), world()),
    storage,
  );
  await session.journey({ type: "reset", confirmed: true }, first);
  const loaded = await storage.load(await mockGameService.loadGame());
  assert.equal(loaded.journey.startedAt, null);
  assert.equal(loaded.player.xp, 0);
  assert.equal(loaded.player.level, 1);
});

test("real journeys require a reference clock, so legacy XP cannot be awarded", async () => {
  const session = createGameSession(
    projectJourney(await mockGameService.loadGame(), start()),
    createJourneyStorage(memory()),
  );
  await assert.rejects(
    () => session.completeQuest("day-1:train-your-ears"),
    /clock/,
  );
  await assert.rejects(
    () => session.activateQuest("day-1:train-your-ears"),
    /clock/,
  );
  const result = await session.completeQuest("day-1:train-your-ears", first);
  assert.equal(result.snapshot.player.xp, 20);
});
test("concurrent distinct quests publish one day bonus without losing XP", async () => {
  const m = memory();
  const s = start();
  const session = createGameSession(
    projectJourney(await mockGameService.loadGame(), s),
    createJourneyStorage(m),
  );
  const results = await Promise.all(
    dailyQuests(s).map((q) => session.completeQuest(q.id, first)),
  );
  const final = results.at(-1).snapshot.journey;
  assert.equal(final.studyDays, 1);
  assert.equal(final.totalXpEarned, 70);
  assert.equal(final.sessions.length, 2);
  assert.equal(results.filter((r) => r.feedback.dayComplete).length, 1);
});
test("missing core state or removed effort history is rejected without overwriting it", async () => {
  const initial = await mockGameService.loadGame();
  for (const edit of [
    (s) => delete s.startedAt,
    (s) => (s.sessions = []),
    (s) => delete s.quests,
  ]) {
    const m = memory();
    const s = day(start());
    edit(s);
    const raw = JSON.stringify({ schemaVersion: 2, journey: s });
    m.values.set(JOURNEY_STORAGE_KEY, raw);
    await assert.rejects(() => createJourneyStorage(m).load(initial));
    assert.equal(m.values.get(JOURNEY_STORAGE_KEY), raw);
    assert.equal(m.writes.length, 0);
  }
});
test("failed boss victory write retains HP and retry awards victory exactly once", async () => {
  const m = memory();
  let failure = true;
  const adapter = {
    getItem: m.getItem,
    async setItem(k, v) {
      if (failure) {
        failure = false;
        throw Error("write failed");
      }
      await m.setItem(k, v);
    },
  };
  let s = world();
  for (const step of SILENCE.steps.slice(0, -1))
    s = applyJourneyAction(
      s,
      { type: "bossStep", stepId: step.id },
      first,
    ).journey;
  const session = createGameSession(
    projectJourney(await mockGameService.loadGame(), s),
    createJourneyStorage(adapter),
  );
  await assert.rejects(() =>
    session.journey({ type: "bossStep", stepId: "final" }, first),
  );
  assert.equal(m.writes.length, 0);
  const result = await session.journey(
    { type: "bossStep", stepId: "final" },
    first,
  );
  assert.equal(result.feedback.xpAwarded, 150);
  assert.equal(
    (await session.journey({ type: "bossStep", stepId: "final" }, first))
      .feedback,
    null,
  );
  assert.equal(m.writes.length, 1);
});
test("XP rejects unsafe sums and unnormalized current XP", () => {
  assert.throws(() => awardXp(1, 99, Number.MAX_SAFE_INTEGER), RangeError);
  assert.throws(() => awardXp(1, 100, 0), RangeError);
  assert.throws(() => xpRequiredForLevel(Number.MAX_SAFE_INTEGER), RangeError);
});
