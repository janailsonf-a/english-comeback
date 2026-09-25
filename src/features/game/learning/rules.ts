import { addCalendarDays } from "../journey/calendar";
import type { Clock, JourneyState } from "../journey/types";
import type { MissionAttempt } from "../missions/types";
import {
  MISSION_VOCABULARY,
  REVIEW_INTERVAL_DAYS,
  STARTER_VOCABULARY,
  vocabularyIdForMissionStep,
} from "./config";
import { initialLearningState, vocabularyEntry } from "./state";
import type {
  LearningAction,
  LearningState,
  VocabularyEntry,
  VocabularyReviewResult,
} from "./types";

function normalizeTerm(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function migrateLearningState(state: JourneyState): JourneyState {
  const current = state.learning ?? initialLearningState();
  if (!state.startedAt) {
    if (state.learning) return state;
    return { ...state, learning: current };
  }
  const known = new Set(current.vocabulary.map((entry) => entry.id));
  const missing = STARTER_VOCABULARY.filter(
    (definition) => !known.has(definition.id),
  ).map((definition) => vocabularyEntry(definition, state.startedAt!));
  if (state.learning && missing.length === 0) return state;
  return {
    ...state,
    learning: {
      vocabulary: [...current.vocabulary, ...missing],
      reviews: current.reviews,
    },
  };
}

function nextMastery(entry: VocabularyEntry, result: VocabularyReviewResult) {
  if (result === "PRACTICED")
    return {
      mastery:
        entry.mastery === "NEW" ? ("LEARNING" as const) : entry.mastery,
      streak: entry.correctStreak,
      interval: Math.max(entry.intervalDays, REVIEW_INTERVAL_DAYS.first),
    };
  if (result === "INCORRECT")
    return {
      mastery: "LEARNING" as const,
      streak: 0,
      interval: REVIEW_INTERVAL_DAYS.first,
    };
  const streak = entry.correctStreak + 1;
  if (streak === 1)
    return {
      mastery: "LEARNING" as const,
      streak,
      interval: REVIEW_INTERVAL_DAYS.first,
    };
  if (streak === 2)
    return {
      mastery: "REVIEW" as const,
      streak,
      interval: REVIEW_INTERVAL_DAYS.second,
    };
  if (streak === 3)
    return {
      mastery: "REVIEW" as const,
      streak,
      interval: REVIEW_INTERVAL_DAYS.third,
    };
  return {
    mastery: "MASTERED" as const,
    streak,
    interval: REVIEW_INTERVAL_DAYS.mastered,
  };
}

function reviewEntry(
  entry: VocabularyEntry,
  result: VocabularyReviewResult,
  attempt: MissionAttempt,
) {
  const progression = nextMastery(entry, result);
  return {
    ...entry,
    mastery: progression.mastery,
    correctReviews: entry.correctReviews + (result === "CORRECT" ? 1 : 0),
    incorrectReviews:
      entry.incorrectReviews + (result === "INCORRECT" ? 1 : 0),
    correctStreak: progression.streak,
    intervalDays: progression.interval,
    nextReviewDay: addCalendarDays(
      attempt.calendarDay,
      progression.interval,
    ),
    lastReviewedAt: attempt.completedAt,
  } satisfies VocabularyEntry;
}

export function applyMissionLearning(
  state: JourneyState,
  attempt: MissionAttempt,
): JourneyState {
  const migrated = migrateLearningState(state);
  const binding = MISSION_VOCABULARY.find(
    (candidate) => candidate.missionId === attempt.missionId,
  );
  if (!binding || !migrated.learning) return migrated;
  let learning: LearningState = migrated.learning;
  for (const answer of attempt.answers) {
    const vocabularyId = vocabularyIdForMissionStep(
      binding.missionId,
      answer.stepId,
    );
    if (!vocabularyId) continue;
    const reviewId = `review:${attempt.id}:${answer.stepId}`;
    if (learning.reviews.some((review) => review.id === reviewId)) continue;
    const result: VocabularyReviewResult =
      answer.correct === null
        ? "PRACTICED"
        : answer.correct
          ? "CORRECT"
          : "INCORRECT";
    learning = {
      vocabulary: learning.vocabulary.map((entry) =>
        entry.id === vocabularyId ? reviewEntry(entry, result, attempt) : entry,
      ),
      reviews: [
        ...learning.reviews,
        {
          id: reviewId,
          vocabularyId,
          missionAttemptId: attempt.id,
          missionId: attempt.missionId,
          stepId: answer.stepId,
          result,
          reviewedAt: answer.answeredAt,
          calendarDay: attempt.calendarDay,
        },
      ],
    };
  }
  return learning === migrated.learning ? migrated : { ...migrated, learning };
}

export function applyLearningAction(
  state: JourneyState,
  action: LearningAction,
  now: Clock,
) {
  if (!state.startedAt || now.day < (state.lastObservedDay ?? now.day))
    return state;
  const migrated = migrateLearningState(state);
  if (!migrated.learning) return state;
  const term = action.term.trim().replace(/\s+/g, " ");
  const meaning = action.meaning.trim().replace(/\s+/g, " ");
  const example = action.example?.trim().replace(/\s+/g, " ") || null;
  if (
    term.length < 1 ||
    term.length > 80 ||
    meaning.length < 1 ||
    meaning.length > 240 ||
    (example?.length ?? 0) > 300 ||
    migrated.learning.vocabulary.some(
      (entry) => normalizeTerm(entry.term) === normalizeTerm(term),
    )
  )
    return migrated;
  const normalized = normalizeTerm(term);
  const entry: VocabularyEntry = {
    id: `manual:${stableHash(normalized)}`,
    term,
    meaning,
    example,
    source: "manual",
    addedAt: now.instant,
    mastery: "NEW",
    correctReviews: 0,
    incorrectReviews: 0,
    correctStreak: 0,
    intervalDays: 0,
    nextReviewDay: null,
    lastReviewedAt: null,
  };
  return {
    ...migrated,
    learning: {
      ...migrated.learning,
      vocabulary: [...migrated.learning.vocabulary, entry],
    },
  };
}
