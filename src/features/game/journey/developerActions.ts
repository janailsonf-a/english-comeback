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
import type { Clock, JourneyQuest, JourneyState } from "./types";
import { applyMissionAction } from "../missions/rules";
import { currentMissionStep } from "../missions/selectors";
import { missionDefinition } from "../missions/content";

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
  | "simulatePace"
  | "startInteractiveMission"
  | "completeMission"
  | "resetMission"
  | "correctAnswer"
  | "wrongAnswer"
  | "completeSpeakingTimer";
function completeDevelopmentQuest(
  state: JourneyState,
  quest: JourneyQuest,
  now: Clock,
): JourneyState {
  if (quest.experience !== "interactive")
    return applyJourneyAction(
      state,
      { type: "complete", questId: quest.id },
      now,
    ).journey;
  let next = state;
  if (!next.missions?.active)
    next = applyMissionAction(
      next,
      { type: "start", questId: quest.id },
      now,
    ).journey;
  return applyMissionAction(
    next,
    {
      type: "complete",
      questId: quest.id,
      elapsedSeconds: 0,
      developerBypass: true,
    },
    now,
  ).journey;
}

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
  if (action === "startInteractiveMission") {
    const quest = dailyQuests(next).find(
      (candidate) =>
        candidate.experience === "interactive" &&
        candidate.status !== "completed",
    );
    return quest
      ? applyMissionAction(next, { type: "start", questId: quest.id }, now)
      : { journey: next, feedback: null };
  }
  if (action === "completeMission") {
    let active = next.missions?.active;
    if (!active) return { journey: next, feedback: null };
    if (active.status === "PAUSED") {
      next = applyMissionAction(
        next,
        { type: "resume", questId: active.questId },
        now,
      ).journey;
      active = next.missions?.active;
    }
    if (!active) return { journey: next, feedback: null };
    return applyMissionAction(
      next,
      {
        type: "complete",
        questId: active.questId,
        elapsedSeconds: active.elapsedSeconds,
        developerBypass: true,
      },
      now,
    );
  }
  if (action === "resetMission") {
    const active = next.missions?.active;
    return active
      ? applyMissionAction(
          next,
          { type: "reset", questId: active.questId, developerBypass: true },
          now,
        )
      : { journey: next, feedback: null };
  }
  if (action === "correctAnswer" || action === "wrongAnswer") {
    let active = next.missions?.active;
    if (active?.status === "PAUSED") {
      next = applyMissionAction(
        next,
        { type: "resume", questId: active.questId },
        now,
      ).journey;
      active = next.missions?.active;
    }
    const definition = active ? missionDefinition(active.missionId) : null;
    const step =
      active && definition ? currentMissionStep(definition, active) : null;
    if (
      !active ||
      !step ||
      step.kind === "PROMPT" ||
      step.kind === "MANUAL_PRACTICE"
    )
      return { journey: next, feedback: null };
    if (definition?.type === "LISTENING")
      next = applyMissionAction(
        next,
        { type: "audioPlayed", questId: active.questId },
        now,
      ).journey;
    const value =
      action === "correctAnswer"
        ? step.correctOptionId
        : (step.options.find((option) => option.id !== step.correctOptionId)
            ?.id ?? step.correctOptionId);
    return applyMissionAction(
      next,
      {
        type: "answer",
        questId: active.questId,
        stepId: step.id,
        value,
        elapsedSeconds: active.elapsedSeconds,
      },
      now,
    );
  }
  if (action === "completeSpeakingTimer") {
    let active = next.missions?.active;
    if (active?.status === "PAUSED") {
      next = applyMissionAction(
        next,
        { type: "resume", questId: active.questId },
        now,
      ).journey;
      active = next.missions?.active;
    }
    const definition = active ? missionDefinition(active.missionId) : null;
    if (!active || definition?.type !== "SPEAKING")
      return { journey: next, feedback: null };
    let run = active;
    while (run.currentStep < definition.steps.length - 1) {
      next = applyMissionAction(
        next,
        {
          type: "advance",
          questId: run.questId,
          stepId: definition.steps[run.currentStep].id,
          elapsedSeconds: definition.minimumActiveSeconds,
        },
        now,
      ).journey;
      run = next.missions?.active ?? run;
    }
    return {
      journey: {
        ...next,
        missions: next.missions
          ? {
              ...next.missions,
              active: {
                ...run,
                elapsedSeconds: definition.minimumActiveSeconds,
              },
            }
          : next.missions,
      },
      feedback: null,
    };
  }
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
        next = completeDevelopmentQuest(next, quest, time);
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
        next = completeDevelopmentQuest(next, quest, now);
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
