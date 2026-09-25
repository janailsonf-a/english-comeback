import { calendarOrdinal } from "../journey/calendar";
import type { JourneyState } from "../journey/types";
import { migrateLearningState } from "../learning/rules";
import { vocabularyIdForMissionStep } from "../learning/config";
import type {
  LearningState,
  VocabularyReviewResult,
} from "../learning/types";
import { migrateMissionState } from "../missions/migration";
import { projectJourney } from "../journey/projectSnapshot";
import { validateJourney } from "./journeyStorage";
import {
  createMissionStorage,
  validateMissionProgress,
} from "./missionStorage";
import type { KeyValueStorage, ProgressStorage } from "./progressStorage";

export const LEARNING_STORAGE_KEY = "@english-comeback/learning-v5";
export const LEARNING_SCHEMA_VERSION = 5;

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
function calendarDay(value: unknown) {
  if (typeof value !== "string") return false;
  try {
    calendarOrdinal(value);
    return true;
  } catch {
    return false;
  }
}
function fail(): never {
  throw new Error(
    "Invalid learning save. The previous data has been preserved.",
  );
}

export function validateLearningState(journey: JourneyState) {
  const value: unknown = journey.learning;
  if (
    !record(value) ||
    !Array.isArray(value.vocabulary) ||
    !Array.isArray(value.reviews)
  )
    fail();
  const learning = value as unknown as LearningState;
  if (
    new Set(learning.vocabulary.map((entry) => entry.id)).size !==
      learning.vocabulary.length ||
    new Set(learning.vocabulary.map((entry) => entry.term.toLowerCase())).size !==
      learning.vocabulary.length ||
    new Set(learning.reviews.map((review) => review.id)).size !==
      learning.reviews.length
  )
    fail();
  for (const entry of learning.vocabulary) {
    if (
      typeof entry.id !== "string" ||
      !entry.id ||
      typeof entry.term !== "string" ||
      !entry.term ||
      typeof entry.meaning !== "string" ||
      !entry.meaning ||
      !(entry.example === null || typeof entry.example === "string") ||
      !["starter", "manual", "mission"].includes(entry.source) ||
      !instant(entry.addedAt) ||
      !["NEW", "LEARNING", "REVIEW", "MASTERED"].includes(entry.mastery) ||
      !integer(entry.correctReviews) ||
      !integer(entry.incorrectReviews) ||
      !integer(entry.correctStreak) ||
      entry.correctStreak > entry.correctReviews ||
      !integer(entry.intervalDays) ||
      !(entry.nextReviewDay === null || calendarDay(entry.nextReviewDay)) ||
      !(entry.lastReviewedAt === null || instant(entry.lastReviewedAt))
    )
      fail();
  }
  const results: readonly VocabularyReviewResult[] = [
    "CORRECT",
    "INCORRECT",
    "PRACTICED",
  ];
  for (const review of learning.reviews) {
    if (
      typeof review.id !== "string" ||
      !learning.vocabulary.some((entry) => entry.id === review.vocabularyId) ||
      !results.includes(review.result) ||
      !instant(review.reviewedAt) ||
      !calendarDay(review.calendarDay)
    )
      fail();
    const linked =
      review.missionAttemptId !== null ||
      review.missionId !== null ||
      review.stepId !== null;
    if (!linked) continue;
    if (
      typeof review.missionAttemptId !== "string" ||
      typeof review.missionId !== "string" ||
      typeof review.stepId !== "string"
    )
      fail();
    const attempt = journey.missions?.attempts.find(
      (candidate) => candidate.id === review.missionAttemptId,
    );
    const answer = attempt?.answers.find(
      (candidate) => candidate.stepId === review.stepId,
    );
    const expectedResult =
      answer?.correct === null
        ? "PRACTICED"
        : answer?.correct
          ? "CORRECT"
          : "INCORRECT";
    if (
      !attempt ||
      !answer ||
      attempt.missionId !== review.missionId ||
      review.id !== `review:${attempt.id}:${review.stepId}` ||
      review.vocabularyId !==
        vocabularyIdForMissionStep(review.missionId, review.stepId) ||
      review.result !== expectedResult ||
      review.reviewedAt !== answer.answeredAt ||
      review.calendarDay !== attempt.calendarDay
    )
      fail();
  }
  for (const entry of learning.vocabulary) {
    const reviews = learning.reviews.filter(
      (review) => review.vocabularyId === entry.id,
    );
    if (
      entry.correctReviews !==
        reviews.filter((review) => review.result === "CORRECT").length ||
      entry.incorrectReviews !==
        reviews.filter((review) => review.result === "INCORRECT").length ||
      (reviews.length === 0 &&
        (entry.mastery !== "NEW" ||
          entry.intervalDays !== 0 ||
          entry.nextReviewDay !== null ||
          entry.lastReviewedAt !== null))
    )
      fail();
  }
}

export function createLearningStorage(
  storage: KeyValueStorage,
): ProgressStorage {
  const previous = createMissionStorage(storage);
  return {
    async load(initial) {
      const raw = await storage.getItem(LEARNING_STORAGE_KEY);
      if (raw === null) {
        const old = await previous.load(initial);
        if (!old.journey) return old;
        const journey = migrateLearningState(old.journey);
        validateJourney(journey);
        validateMissionProgress(journey);
        validateLearningState(journey);
        await storage.setItem(
          LEARNING_STORAGE_KEY,
          JSON.stringify({ schemaVersion: LEARNING_SCHEMA_VERSION, journey }),
        );
        return projectJourney(old, journey);
      }
      const envelope: unknown = JSON.parse(raw);
      if (
        !record(envelope) ||
        envelope.schemaVersion !== LEARNING_SCHEMA_VERSION ||
        !record(envelope.journey)
      )
        fail();
      let journey = envelope.journey as unknown as JourneyState;
      validateJourney(journey);
      validateMissionProgress(journey);
      validateLearningState(journey);
      const paused = migrateMissionState(journey, true);
      if (paused !== journey) {
        journey = paused;
        await storage.setItem(
          LEARNING_STORAGE_KEY,
          JSON.stringify({ schemaVersion: LEARNING_SCHEMA_VERSION, journey }),
        );
      }
      return projectJourney(initial, journey);
    },
    async save(snapshot) {
      if (!snapshot.journey) return previous.save(snapshot);
      const journey = migrateLearningState(
        migrateMissionState(snapshot.journey),
      );
      validateJourney(journey);
      validateMissionProgress(journey);
      validateLearningState(journey);
      await storage.setItem(
        LEARNING_STORAGE_KEY,
        JSON.stringify({ schemaVersion: LEARNING_SCHEMA_VERSION, journey }),
      );
    },
  };
}
