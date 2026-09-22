import { totalEngagementXp, xpRequiredForLevel } from "../domain/progression";
import { calendarOrdinal } from "../journey/calendar";
import { ACHIEVEMENTS, CAMPAIGN, SILENCE } from "../journey/config";
import { projectJourney } from "../journey/projectSnapshot";
import { emptyJourney } from "../journey/rules";
import { CATEGORIES, type JourneyState } from "../journey/types";
import {
  createProgressStorage,
  type KeyValueStorage,
  type ProgressStorage,
} from "./progressStorage";

export const JOURNEY_STORAGE_KEY = "@english-comeback/journey-v2";
export const JOURNEY_SCHEMA_VERSION = 2;
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function integer(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
function instant(value: unknown) {
  return (
    typeof value === "string" &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}
function day(value: unknown) {
  try {
    return typeof value === "string" && Number.isFinite(calendarOrdinal(value));
  } catch {
    return false;
  }
}
function nullable(value: unknown, check: (value: unknown) => boolean) {
  return value === null || check(value);
}
function uniqueIds(values: unknown[]) {
  const ids = values.map((v) => (record(v) ? v.id : undefined));
  return (
    ids.every((id) => typeof id === "string" && id.length > 0) &&
    new Set(ids).size === ids.length
  );
}
function fail(): never {
  throw new Error(
    "Saved journey is invalid or unsupported; it has not been replaced.",
  );
}

export function validateJourney(value: unknown): asserts value is JourneyState {
  if (
    !record(value) ||
    typeof value.id !== "string" ||
    !nullable(value.startedAt, instant) ||
    !nullable(value.startedDay, day) ||
    !integer(value.level) ||
    value.level < 1 ||
    !integer(value.xp) ||
    value.xp >= xpRequiredForLevel(value.level) ||
    !integer(value.totalXpEarned) ||
    !integer(value.studyDays) ||
    value.studyDays > SILENCE.unlockStudyDays ||
    !integer(value.streak) ||
    !integer(value.restTokens) ||
    value.restTokens > CAMPAIGN.restTokens.maximum ||
    typeof value.developmentData !== "boolean" ||
    !["NORMAL", "WELCOME_BACK", "COMEBACK_MODE"].includes(
      String(value.comeback),
    )
  )
    fail();
  for (const key of [
    "tokenWeek",
    "consistencyThrough",
    "lastStudyDay",
    "lastActivityDay",
    "lastObservedDay",
  ])
    if (!nullable(value[key], day)) fail();
  for (const key of [
    "quests",
    "sessions",
    "achievements",
    "xpRecords",
    "completedDays",
  ])
    if (!Array.isArray(value[key])) fail();
  if (
    !Array.isArray(value.quests) ||
    !uniqueIds(value.quests) ||
    !value.quests.every(
      (q) =>
        record(q) &&
        typeof q.templateId === "string" &&
        typeof q.title === "string" &&
        typeof q.description === "string" &&
        CATEGORIES.includes(q.category as (typeof CATEGORIES)[number]) &&
        ["EASY", "NORMAL", "HARD"].includes(String(q.difficulty)) &&
        typeof q.duration === "string" &&
        nullable(q.durationMinutes, integer) &&
        typeof q.objective === "string" &&
        integer(q.xpReward) &&
        ["available", "active", "completed", "locked"].includes(
          String(q.status),
        ) &&
        integer(q.studyDay) &&
        ["daily", "return"].includes(String(q.kind)) &&
        nullable(q.completedAt, instant) &&
        (q.status === "completed") === (q.completedAt !== null),
    )
  )
    fail();
  if (
    !Array.isArray(value.sessions) ||
    !uniqueIds(value.sessions) ||
    !value.sessions.every(
      (s) =>
        record(s) &&
        CATEGORIES.includes(s.category as (typeof CATEGORIES)[number]) &&
        integer(s.durationMinutes) &&
        ["quest", "return", "boss"].includes(String(s.source)) &&
        (s.questId === null || typeof s.questId === "string") &&
        instant(s.completedAt) &&
        day(s.calendarDay),
    )
  )
    fail();
  if (
    !Array.isArray(value.xpRecords) ||
    !uniqueIds(value.xpRecords) ||
    !value.xpRecords.every(
      (x) =>
        record(x) &&
        integer(x.amount) &&
        ["quest", "day", "boss", "developer"].includes(String(x.source)) &&
        instant(x.completedAt),
    )
  )
    fail();
  if (
    !Array.isArray(value.achievements) ||
    !uniqueIds(value.achievements) ||
    !value.achievements.every(
      (a) =>
        record(a) &&
        typeof a.title === "string" &&
        typeof a.description === "string" &&
        typeof a.unlocked === "boolean" &&
        typeof a.hidden === "boolean" &&
        nullable(a.unlockedAt, instant) &&
        a.unlocked === (a.unlockedAt !== null),
    )
  )
    fail();
  if (
    !Array.isArray(value.completedDays) ||
    !value.completedDays.every(
      (d) =>
        record(d) &&
        integer(d.studyDay) &&
        d.studyDay > 0 &&
        instant(d.completedAt) &&
        day(d.calendarDay),
    ) ||
    value.completedDays.length !== value.studyDays
  )
    fail();
  if (
    !record(value.boss) ||
    !Array.isArray(value.boss.completedSteps) ||
    !value.boss.completedSteps.every((id) =>
      SILENCE.steps.some((s) => s.id === id),
    ) ||
    new Set(value.boss.completedSteps).size !==
      value.boss.completedSteps.length ||
    !nullable(value.boss.defeatedAt, instant)
  )
    fail();
  const state = value as unknown as JourneyState;
  if (
    state.totalXpEarned !==
      state.xpRecords.reduce((sum, x) => sum + x.amount, 0) ||
    state.totalXpEarned !== totalEngagementXp(state.level, state.xp)
  )
    fail();
  if (
    Boolean(state.startedAt) !== Boolean(state.startedDay) ||
    (state.startedAt && (!state.tokenWeek || !state.lastActivityDay))
  )
    fail();
  if (
    !state.startedAt &&
    (state.totalXpEarned ||
      state.studyDays ||
      state.quests.length ||
      state.sessions.length ||
      state.boss.completedSteps.length ||
      state.achievements.some((a) => a.unlocked))
  )
    fail();
  for (let index = 0; index < state.studyDays; index++) {
    if (
      state.completedDays[index].studyDay !== index + 1 ||
      !state.xpRecords.some(
        (x) => x.id === `day:${index + 1}` && x.amount === CAMPAIGN.dailyBonus,
      )
    )
      fail();
    const quests = state.quests.filter(
      (q) => q.kind === "daily" && q.studyDay === index + 1,
    );
    if (
      quests.length !== CAMPAIGN.dailyQuestCount ||
      quests.some((q) => q.status !== "completed")
    )
      fail();
  }
  for (const step of state.boss.completedSteps) {
    if (
      !state.sessions.some(
        (session) => session.id === `boss:${step}` && session.source === "boss",
      )
    )
      fail();
  }
  if (
    !state.boss.completedSteps.every(
      (id, index) => id === SILENCE.steps[index].id,
    )
  )
    fail();
  for (const quest of state.quests) {
    if (
      quest.status === "completed" &&
      quest.durationMinutes !== null &&
      !state.sessions.some(
        (session) =>
          session.id === `quest:${quest.id}` &&
          session.questId === quest.id &&
          session.category === quest.category &&
          session.durationMinutes === quest.durationMinutes,
      )
    )
      fail();
    if (
      quest.status === "completed" &&
      !state.xpRecords.some(
        (x) => x.id === `quest:${quest.id}` && x.amount === quest.xpReward,
      )
    )
      fail();
  }
  if (state.startedAt && state.studyDays < SILENCE.unlockStudyDays) {
    const current = state.quests.filter(
      (q) => q.kind === "daily" && q.studyDay === state.studyDays + 1,
    );
    if (
      current.length !== CAMPAIGN.dailyQuestCount ||
      current.every((q) => q.status === "completed")
    )
      fail();
  }
  if (
    (state.boss.completedSteps.length &&
      state.studyDays < SILENCE.unlockStudyDays) ||
    Boolean(state.boss.defeatedAt) !==
      (state.boss.completedSteps.length === SILENCE.steps.length) ||
    (state.boss.defeatedAt &&
      !state.xpRecords.some(
        (x) => x.id === `boss:${SILENCE.id}` && x.amount === SILENCE.xpReward,
      ))
  )
    fail();
}

export function createJourneyStorage(
  storage: KeyValueStorage,
): ProgressStorage {
  const legacy = createProgressStorage(storage);
  return {
    async load(initial) {
      const raw = await storage.getItem(JOURNEY_STORAGE_KEY);
      // Migration is explicit: preserve schema-1 data and display Start Journey.
      // Starting/resetting writes only v2; the original demonstration key remains.
      if (raw === null) return legacy.load(initial);
      const envelope: unknown = JSON.parse(raw);
      if (
        !record(envelope) ||
        envelope.schemaVersion !== JOURNEY_SCHEMA_VERSION ||
        !record(envelope.journey)
      )
        fail();
      for (const key of [
        "id",
        "startedAt",
        "startedDay",
        "level",
        "xp",
        "totalXpEarned",
        "studyDays",
        "quests",
        "sessions",
        "xpRecords",
        "completedDays",
        "boss",
      ])
        if (!(key in envelope.journey)) fail();
      const restored: unknown = { ...emptyJourney(), ...envelope.journey };
      validateJourney(restored);
      const achievements = [...restored.achievements];
      for (const definition of ACHIEVEMENTS)
        if (!achievements.some((a) => a.id === definition.id))
          achievements.push({
            ...definition,
            unlocked: false,
            unlockedAt: null,
            hidden: false,
          });
      return projectJourney(initial, { ...restored, achievements });
    },
    async save(snapshot) {
      if (!snapshot.journey) return legacy.save(snapshot);
      validateJourney(snapshot.journey);
      await storage.setItem(
        JOURNEY_STORAGE_KEY,
        JSON.stringify({
          schemaVersion: JOURNEY_SCHEMA_VERSION,
          journey: snapshot.journey,
        }),
      );
    },
  };
}
