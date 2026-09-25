import { calendarOrdinal } from "../journey/calendar";
import { MISSION_VOCABULARY } from "./config";
import type { LearningState, VocabularyEntry } from "./types";

export function vocabularyIsWeak(entry: VocabularyEntry) {
  return (
    entry.incorrectReviews > 0 &&
    entry.incorrectReviews >= entry.correctReviews
  );
}

export function vocabularyIsDue(entry: VocabularyEntry, today: string) {
  return (
    entry.nextReviewDay !== null &&
    calendarOrdinal(entry.nextReviewDay) <= calendarOrdinal(today)
  );
}

export function learningMetrics(state: LearningState, today: string) {
  return {
    total: state.vocabulary.length,
    learning: state.vocabulary.filter((entry) => entry.mastery !== "MASTERED")
      .length,
    mastered: state.vocabulary.filter((entry) => entry.mastery === "MASTERED")
      .length,
    weak: state.vocabulary.filter(vocabularyIsWeak).length,
    due: state.vocabulary.filter((entry) => vocabularyIsDue(entry, today))
      .length,
    reviews: state.reviews.length,
  };
}

export function recommendedVocabularyMissionIds(
  state: LearningState,
  today: string,
) {
  const urgency = new Map(
    state.vocabulary.map((entry) => [
      entry.id,
      (vocabularyIsWeak(entry) ? 4 : 0) +
        (vocabularyIsDue(entry, today) ? 2 : 0) +
        (entry.mastery === "NEW" ? 1 : 0),
    ]),
  );
  return MISSION_VOCABULARY.map((binding, index) => ({
    id: binding.missionId,
    index,
    score: [...new Set(Object.values(binding.steps))].reduce(
      (total, vocabularyId) => total + (urgency.get(vocabularyId) ?? 0),
      0,
    ),
  }))
    .filter((mission) => mission.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((mission) => mission.id);
}

export function prioritizedVocabulary(
  state: LearningState,
  today: string,
) {
  return [...state.vocabulary].sort((a, b) => {
    const score = (entry: VocabularyEntry) =>
      (vocabularyIsWeak(entry) ? 4 : 0) +
      (vocabularyIsDue(entry, today) ? 2 : 0) +
      (entry.mastery === "NEW" ? 1 : 0);
    return score(b) - score(a) || a.term.localeCompare(b.term);
  });
}
