import { missionDefinition } from "../missions/content";
import { calendarOrdinal } from "../journey/calendar";
import { migrateMissionState } from "../missions/migration";
import type {
  MissionAnswer,
  MissionAttempt,
  MissionProgressState,
  MissionRun,
  MissionStep,
} from "../missions/types";
import { validLocalRecordingReference } from "../journey/narrative/rules";
import { projectJourney } from "../journey/projectSnapshot";
import type { JourneyQuest, JourneyState } from "../journey/types";
import { validateJourney } from "./journeyStorage";
import { createNarrativeStorage } from "./narrativeStorage";
import type { KeyValueStorage, ProgressStorage } from "./progressStorage";

export const MISSION_STORAGE_KEY = "@english-comeback/missions-v4";
export const MISSION_SCHEMA_VERSION = 4;

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function integer(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
function instant(value: unknown) {
  return (
    typeof value === "string" &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}
function fail(): never {
  throw new Error(
    "Invalid mission save. The previous data has been preserved.",
  );
}
function uniqueIds(values: { id: string }[]) {
  return new Set(values.map((value) => value.id)).size === values.length;
}
function calendarDay(value: unknown) {
  if (typeof value !== "string") return false;
  try {
    calendarOrdinal(value);
    return true;
  } catch {
    return false;
  }
}
function questMatchesDefinition(quest: JourneyQuest, missionId: string) {
  const definition = missionDefinition(missionId);
  return Boolean(
    definition &&
    definition.type !== "EXTERNAL" &&
    quest.experience === "interactive" &&
    quest.interactiveMissionId === definition.id &&
    quest.title === definition.title &&
    quest.category === definition.category &&
    quest.difficulty === definition.difficulty &&
    quest.xpReward === definition.xpReward &&
    quest.objective === definition.objective,
  );
}
function answerValid(answer: MissionAnswer, step: MissionStep) {
  if (answer.stepId !== step.id || !answer.value || !instant(answer.answeredAt))
    return false;
  if (step.kind === "PROMPT") return false;
  if (step.kind === "MANUAL_PRACTICE") return answer.correct === null;
  return (
    step.options.some((option) => option.id === answer.value) &&
    answer.correct === (answer.value === step.correctOptionId)
  );
}
function validateRun(run: MissionRun, journey: JourneyState) {
  const definition = missionDefinition(run.missionId);
  const quest = journey.quests.find(
    (candidate) => candidate.id === run.questId,
  );
  if (
    !definition ||
    definition.type === "EXTERNAL" ||
    !quest ||
    !questMatchesDefinition(quest, definition.id) ||
    quest.status !== "active" ||
    !["IN_PROGRESS", "PAUSED"].includes(run.status) ||
    !integer(run.currentStep) ||
    run.currentStep >= definition.steps.length ||
    !instant(run.startedAt) ||
    !integer(run.elapsedSeconds) ||
    run.elapsedSeconds > 14_400 ||
    !Array.isArray(run.answers) ||
    typeof run.audioPlayed !== "boolean" ||
    run.studyDay !== quest.studyDay ||
    run.worldId !== quest.worldId ||
    run.chapterId !== quest.chapterId
  )
    fail();
  if (
    new Set(run.answers.map((answer) => answer.stepId)).size !==
      run.answers.length ||
    run.answers.some((answer) => {
      const stepIndex = definition.steps.findIndex(
        (candidate) => candidate.id === answer.stepId,
      );
      const step = definition.steps[stepIndex];
      return (
        stepIndex < 0 ||
        stepIndex > run.currentStep ||
        !answerValid(answer, step)
      );
    })
  )
    fail();
}
function validateAttempt(attempt: MissionAttempt, journey: JourneyState) {
  const definition = missionDefinition(attempt.missionId);
  const quest = journey.quests.find(
    (candidate) => candidate.id === attempt.questId,
  );
  if (
    !definition ||
    definition.type === "EXTERNAL" ||
    !quest ||
    !questMatchesDefinition(quest, definition.id) ||
    quest.status !== "completed" ||
    attempt.result !== "COMPLETED" ||
    !instant(attempt.startedAt) ||
    !instant(attempt.completedAt) ||
    !integer(attempt.durationSeconds) ||
    attempt.durationSeconds <= 0 ||
    attempt.durationSeconds > 14_400 ||
    !Array.isArray(attempt.answers) ||
    attempt.studyDay !== quest.studyDay ||
    attempt.worldId !== quest.worldId ||
    attempt.chapterId !== quest.chapterId ||
    !calendarDay(attempt.calendarDay) ||
    Date.parse(attempt.completedAt) < Date.parse(attempt.startedAt) ||
    quest.completedAt !== attempt.completedAt ||
    typeof attempt.development !== "boolean" ||
    (attempt.development && !journey.developmentData) ||
    !(
      attempt.localRecordingReference === null ||
      (definition.type === "SPEAKING" &&
        validLocalRecordingReference(attempt.localRecordingReference))
    )
  )
    fail();
  if (
    new Set(attempt.answers.map((answer) => answer.stepId)).size !==
      attempt.answers.length ||
    attempt.answers.some((answer) => {
      const step = definition.steps.find(
        (candidate) => candidate.id === answer.stepId,
      );
      return !step || !answerValid(answer, step);
    }) ||
    (!attempt.development &&
      (attempt.durationSeconds < definition.minimumActiveSeconds ||
        definition.steps.some(
          (step) =>
            step.kind !== "PROMPT" &&
            !attempt.answers.some((answer) => answer.stepId === step.id),
        ))) ||
    !journey.sessions.some(
      (session) =>
        session.id === `mission:${attempt.id}` &&
        session.source === "mission" &&
        session.questId === quest.id &&
        session.category === definition.category &&
        session.durationMinutes ===
          Math.max(1, Math.ceil(attempt.durationSeconds / 60)) &&
        session.completedAt === attempt.completedAt &&
        session.calendarDay === attempt.calendarDay,
    ) ||
    !journey.xpRecords.some(
      (record) =>
        record.id === `quest:${quest.id}` &&
        record.amount === definition.xpReward &&
        record.completedAt === attempt.completedAt,
    )
  )
    fail();
}

export function validateMissionProgress(journey: JourneyState) {
  const value: unknown = journey.missions;
  if (
    !record(value) ||
    !(value.active === null || record(value.active)) ||
    !Array.isArray(value.attempts)
  )
    fail();
  const missions = value as unknown as MissionProgressState;
  if (!uniqueIds(missions.attempts)) fail();
  if (missions.active) {
    if (
      typeof missions.active.attemptId !== "string" ||
      missions.attempts.some(
        (attempt) => attempt.id === missions.active?.attemptId,
      )
    )
      fail();
    validateRun(missions.active, journey);
  }
  for (const attempt of missions.attempts) validateAttempt(attempt, journey);
  if (
    journey.quests.some(
      (quest) =>
        quest.experience === "interactive" &&
        quest.status === "completed" &&
        missions.attempts.filter((attempt) => attempt.questId === quest.id)
          .length !== 1,
    ) ||
    journey.sessions.some(
      (session) =>
        session.source === "mission" &&
        !missions.attempts.some(
          (attempt) => `mission:${attempt.id}` === session.id,
        ),
    )
  )
    fail();
  const references = missions.attempts
    .map((attempt) => attempt.localRecordingReference)
    .filter((reference): reference is string => reference !== null);
  if (new Set(references).size !== references.length) fail();
}

export function createMissionStorage(
  storage: KeyValueStorage,
): ProgressStorage {
  const previous = createNarrativeStorage(storage);
  return {
    async load(initial) {
      const raw = await storage.getItem(MISSION_STORAGE_KEY);
      if (raw === null) {
        const old = await previous.load(initial);
        if (!old.journey) return old;
        const journey = migrateMissionState(old.journey, true);
        validateJourney(journey);
        validateMissionProgress(journey);
        await storage.setItem(
          MISSION_STORAGE_KEY,
          JSON.stringify({
            schemaVersion: MISSION_SCHEMA_VERSION,
            journey,
          }),
        );
        return projectJourney(old, journey);
      }
      const envelope: unknown = JSON.parse(raw);
      if (
        !record(envelope) ||
        envelope.schemaVersion !== MISSION_SCHEMA_VERSION ||
        !record(envelope.journey)
      )
        fail();
      let journey = envelope.journey as unknown as JourneyState;
      validateJourney(journey);
      validateMissionProgress(journey);
      const paused = migrateMissionState(journey, true);
      if (paused !== journey) {
        journey = paused;
        await storage.setItem(
          MISSION_STORAGE_KEY,
          JSON.stringify({
            schemaVersion: MISSION_SCHEMA_VERSION,
            journey,
          }),
        );
      }
      return projectJourney(initial, journey);
    },
    async save(snapshot) {
      if (!snapshot.journey) return previous.save(snapshot);
      const journey = migrateMissionState(snapshot.journey);
      validateJourney(journey);
      validateMissionProgress(journey);
      await storage.setItem(
        MISSION_STORAGE_KEY,
        JSON.stringify({
          schemaVersion: MISSION_SCHEMA_VERSION,
          journey,
        }),
      );
    },
  };
}
