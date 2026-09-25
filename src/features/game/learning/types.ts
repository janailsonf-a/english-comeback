import type { CalendarDay } from "../journey/types";

export type VocabularyMastery = "NEW" | "LEARNING" | "REVIEW" | "MASTERED";
export type VocabularySource = "starter" | "manual" | "mission";
export type VocabularyReviewResult = "CORRECT" | "INCORRECT" | "PRACTICED";

export interface VocabularyEntry {
  id: string;
  term: string;
  meaning: string;
  example: string | null;
  source: VocabularySource;
  addedAt: string;
  mastery: VocabularyMastery;
  correctReviews: number;
  incorrectReviews: number;
  correctStreak: number;
  intervalDays: number;
  nextReviewDay: CalendarDay | null;
  lastReviewedAt: string | null;
}

export interface VocabularyReview {
  id: string;
  vocabularyId: string;
  missionAttemptId: string | null;
  missionId: string | null;
  stepId: string | null;
  result: VocabularyReviewResult;
  reviewedAt: string;
  calendarDay: CalendarDay;
}

export interface LearningState {
  vocabulary: VocabularyEntry[];
  reviews: VocabularyReview[];
}

export type LearningAction = {
  type: "importVocabulary";
  term: string;
  meaning: string;
  example?: string;
};
