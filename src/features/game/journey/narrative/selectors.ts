import { addCalendarDays, calendarOrdinal } from "../calendar";
import { CAMPAIGN, WORLDS } from "../config";
import type { JourneyState } from "../types";
import { CAMPAIGNS, CHAPTERS, PROJECTION, TITLES } from "./config";
export function campaignState(journey: JourneyState) {
  return CAMPAIGNS.map((campaign) => ({
    ...campaign,
    status:
      campaign.id === (journey.narrative?.campaignId ?? CAMPAIGNS[0].id)
        ? ("ACTIVE" as const)
        : ("LOCKED" as const),
  }));
}
export function chapterForDay(day: number) {
  return (
    CHAPTERS.find((chapter) => day >= chapter.start && day <= chapter.end) ??
    null
  );
}
export function currentChapter(journey: JourneyState) {
  const position =
    journey.studyDays >= WORLDS[0].end && !journey.boss.defeatedAt
      ? WORLDS[0].end
      : journey.studyDays + 1;
  return chapterForDay(position);
}
export function chapterProgress(
  journey: JourneyState,
  chapter = currentChapter(journey),
) {
  if (!chapter) return null;
  const total = chapter.end - chapter.start + 1;
  const completed = Math.max(
    0,
    Math.min(total, journey.studyDays - chapter.start + 1),
  );
  return { chapter, completed, total, fraction: completed / total };
}
export function equippedTitle(journey: JourneyState) {
  return (
    TITLES.find((title) => title.id === journey.narrative?.equippedTitleId)
      ?.title ?? null
  );
}
export type ProjectionResult =
  | { status: "building" }
  | { status: "complete" }
  | {
      status: "estimate";
      weeksRemaining: number;
      observedDays: number;
      studyDaysCompleted: number;
    };
export function projectedCompletion(
  journey: JourneyState,
  today: string,
): ProjectionResult {
  if (journey.studyDays >= CAMPAIGN.studyDays) return { status: "complete" };
  if (!journey.startedDay || today < journey.startedDay)
    return { status: "building" };
  const start = [
    journey.startedDay,
    addCalendarDays(today, -(PROJECTION.windowDays - 1)),
  ]
    .sort()
    .at(-1)!;
  const observedDays = calendarOrdinal(today) - calendarOrdinal(start) + 1;
  const recent = journey.completedDays.filter(
    (day) => day.calendarDay >= start && day.calendarDay <= today,
  );
  if (
    observedDays < PROJECTION.minimumObservedDays ||
    new Set(recent.map((day) => day.calendarDay)).size <
      PROJECTION.minimumDistinctStudyDates
  )
    return { status: "building" };
  const pace = recent.length / observedDays;
  return {
    status: "estimate",
    weeksRemaining: Math.max(
      1,
      Math.ceil((CAMPAIGN.studyDays - journey.studyDays) / pace / 7),
    ),
    observedDays,
    studyDaysCompleted: recent.length,
  };
}
