import { STARTER_VOCABULARY } from "./config";
import type { LearningState, VocabularyEntry } from "./types";

export function vocabularyEntry(
  definition: (typeof STARTER_VOCABULARY)[number],
  addedAt: string,
): VocabularyEntry {
  return {
    ...definition,
    source: "starter",
    addedAt,
    mastery: "NEW",
    correctReviews: 0,
    incorrectReviews: 0,
    correctStreak: 0,
    intervalDays: 0,
    nextReviewDay: null,
    lastReviewedAt: null,
  };
}

export function initialLearningState(addedAt?: string): LearningState {
  return {
    vocabulary: addedAt
      ? STARTER_VOCABULARY.map((definition) =>
          vocabularyEntry(definition, addedAt),
        )
      : [],
    reviews: [],
  };
}
