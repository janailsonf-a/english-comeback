import { currentChapter } from "./narrative/selectors";
import {
  migrateNarrative,
  applyNarrativeAction,
  unlockTitles,
} from "./narrative/rules";
import { TITLES, PROLOGUE, DEVELOPMENT_PACE } from "./narrative/config";
import { addCalendarDays } from "./calendar";
import { SILENCE, CAMPAIGN } from "./config";
import { dailyQuests } from "./selectors";
import { grantXp } from "./rewards";
import {
  applyJourneyAction,
  refreshJourney,
  type JourneyResult,
} from "./rules";
import type { Clock, JourneyState } from "./types";

export type DeveloperAction =
  | "advanceDay"
  | "addXp"
  | "inactivity"
  | "addToken"
  | "removeToken"
  | "unlockBoss"
  | "completePrologue"
  | "unlockTitle"
  | "advanceChapter"
  | "mockCapsule"
  | "simulatePace";
export function applyDeveloperAction(
  state: JourneyState,
  action: DeveloperAction,
  now: Clock,
  enabled: boolean,
): JourneyResult {
  if (
    !enabled ||
    !state.startedAt ||
    now.day < (state.lastObservedDay ?? now.day)
  )
    return { journey: state, feedback: null };
  let next = { ...state, developmentData: true };
  if (
    ["completePrologue", "unlockTitle", "mockCapsule", "simulatePace"].includes(
      action,
    )
  )
    next = migrateNarrative(next);
  if (action === "completePrologue")
    return {
      journey: applyNarrativeAction(next, { type: "skipPrologue" }, now),
      feedback: null,
    };
  if (action === "unlockTitle" && next.narrative) {
    const title = TITLES[0];
    if (next.narrative.titles.some((t) => t.id === title.id))
      return { journey: state, feedback: null };
    return {
      journey: {
        ...next,
        narrative: {
          ...next.narrative,
          titles: [
            ...next.narrative.titles,
            { id: title.id, unlockedAt: now.instant, source: "developer" },
          ],
        },
      },
      feedback: {
        questId: `title:${title.id}`,
        xpAwarded: 0,
        levelsGained: 0,
        level: next.level,
        titleIds: [title.id],
      },
    };
  }
  if (action === "mockCapsule" && next.narrative) {
    const id = `capsule:developer:${next.studyDays}`;
    if (next.narrative.timeCapsules.some((c) => c.id === id))
      return { journey: state, feedback: null };
    return {
      journey: {
        ...next,
        narrative: {
          ...next.narrative,
          timeCapsules: [
            ...next.narrative.timeCapsules,
            {
              id,
              createdAt: now.instant,
              studyDay: next.studyDays,
              prompt: PROLOGUE.prompt,
              durationSeconds: 0,
              localRecordingReference: null,
              type: "developer",
            },
          ],
        },
      },
      feedback: null,
    };
  }
  if (action === "simulatePace") {
    if (
      next.studyDays + DEVELOPMENT_PACE.completionOffsets.length >
      SILENCE.unlockStudyDays
    )
      throw new RangeError("Simulate pace early in World 01.");
    for (const offset of DEVELOPMENT_PACE.completionOffsets) {
      const day = addCalendarDays(now.day, offset);
      const date = new Date(now.instant);
      date.setDate(date.getDate() + offset);
      const time = { day, instant: date.toISOString() };
      if (day < (next.lastObservedDay ?? day))
        throw new RangeError(
          "Pace simulation requires a forward reference clock.",
        );
      next = applyNarrativeAction(next, { type: "skipPrologue" }, time);
      for (const quest of dailyQuests(next))
        next = applyJourneyAction(
          next,
          { type: "complete", questId: quest.id },
          time,
        ).journey;
    }
    return { journey: next, feedback: null };
  }
  if (
    action === "advanceDay" ||
    action === "unlockBoss" ||
    action === "advanceChapter"
  ) {
    const target =
      action === "unlockBoss"
        ? SILENCE.unlockStudyDays
        : action === "advanceChapter"
          ? Math.min(
              SILENCE.unlockStudyDays,
              currentChapter(next)?.end ?? SILENCE.unlockStudyDays,
            )
          : Math.min(SILENCE.unlockStudyDays, next.studyDays + 1);
    while (next.studyDays < target) {
      const previousDay = next.studyDays;
      for (const quest of dailyQuests(next))
        next = applyJourneyAction(
          next,
          { type: "complete", questId: quest.id },
          now,
        ).journey;
      if (next.studyDays === previousDay)
        throw new Error(
          "This Study Day cannot advance until its quests are available.",
        );
    }
  } else if (action === "addXp")
    next = grantXp(
      next,
      100,
      `developer:${next.xpRecords.length}`,
      "developer",
      now,
    );
  else if (action === "addToken")
    next = {
      ...next,
      restTokens: Math.min(CAMPAIGN.restTokens.maximum, next.restTokens + 1),
    };
  else if (action === "removeToken")
    next = { ...next, restTokens: Math.max(0, next.restTokens - 1) };
  else {
    // Move the injected clock forward through the normal consistency rules;
    // never rewrite or remove historical dates to simulate inactivity.
    next = refreshJourney(next, now);
  }
  return { journey: unlockTitles(next), feedback: null };
}
