import { totalEngagementXp } from "../../domain/progression";
import type { Clock, JourneyState } from "../types";
import { CAMPAIGNS, PROLOGUE, TITLES } from "./config";
import type { NarrativeState, NarrativeAction, UnlockedTitle } from "./types";
export function initialNarrative(legacy = false): NarrativeState {
  return {
    campaignId: CAMPAIGNS[0].id,
    prologue: { status: legacy ? "legacy" : "pending", completedAt: null },
    titles: [],
    equippedTitleId: null,
    timeCapsules: [],
  };
}
export function validLocalRecordingReference(value: string) {
  return (
    value.length > 0 &&
    value.length < 1024 &&
    !value.startsWith("/") &&
    !value.includes(":") &&
    !value.includes("\\") &&
    value
      .split("/")
      .every((part) => part.length > 0 && part !== "." && part !== "..") &&
    !/[\x00-\x1f\x7f%?#]/.test(value)
  );
}
export function unlockTitles(state: JourneyState): JourneyState {
  if (!state.narrative) return state;
  const additions: UnlockedTitle[] = [];
  for (const title of TITLES) {
    if (state.narrative.titles.some((unlocked) => unlocked.id === title.id))
      continue;
    let unlockedAt: string | null = null;
    if (
      title.requirement.kind === "level" &&
      state.level >= title.requirement.value
    ) {
      const threshold = totalEngagementXp(title.requirement.value, 0);
      let xp = 0;
      for (const record of state.xpRecords) {
        xp += record.amount;
        if (xp >= threshold) {
          unlockedAt = record.completedAt;
          break;
        }
      }
    } else if (title.requirement.kind === "speaking") {
      let minutes = 0;
      for (const session of state.sessions)
        if (session.category === "Speaking") {
          minutes += session.durationMinutes;
          if (minutes >= title.requirement.value) {
            unlockedAt = session.completedAt;
            break;
          }
        }
    } else if (title.requirement.kind === "boss")
      unlockedAt = state.boss.defeatedAt;
    if (unlockedAt)
      additions.push({ id: title.id, unlockedAt, source: "progress" });
  }
  return additions.length
    ? {
        ...state,
        narrative: {
          ...state.narrative,
          titles: [...state.narrative.titles, ...additions],
        },
      }
    : state;
}
export function migrateNarrative(state: JourneyState): JourneyState {
  return unlockTitles(
    state.narrative
      ? state
      : { ...state, narrative: initialNarrative(Boolean(state.startedAt)) },
  );
}
export function needsPrologue(state: JourneyState) {
  return Boolean(
    state.startedAt && state.narrative?.prologue.status === "pending",
  );
}
export function applyNarrativeAction(
  state: JourneyState,
  action: NarrativeAction,
  now: Clock,
): JourneyState {
  if (
    !state.startedAt ||
    !state.narrative ||
    now.day < (state.lastObservedDay ?? now.day)
  )
    return state;
  const narrative = state.narrative;
  if (action.type === "equipTitle") {
    if (
      action.titleId !== null &&
      !narrative.titles.some((title) => title.id === action.titleId)
    )
      return state;
    return narrative.equippedTitleId === action.titleId
      ? state
      : {
          ...state,
          narrative: { ...narrative, equippedTitleId: action.titleId },
        };
  }
  if (action.type === "skipPrologue") {
    return narrative.prologue.status !== "pending"
      ? state
      : {
          ...state,
          narrative: {
            ...narrative,
            prologue: { status: "skipped", completedAt: now.instant },
          },
        };
  }
  const { recording } = action;
  if (
    !validLocalRecordingReference(recording.localRecordingReference) ||
    !Number.isFinite(recording.durationSeconds) ||
    recording.durationSeconds <= 0 ||
    recording.durationSeconds > 3600
  )
    throw new RangeError("Invalid local recording.");
  const isPrologue = narrative.prologue.status === "pending";
  // A fixed prologue ID protects double-save even after the first save changes
  // status. Recording references also remain unique for checkpoint saves.
  if (
    narrative.timeCapsules.some(
      (capsule) =>
        capsule.localRecordingReference === recording.localRecordingReference,
    )
  )
    return state;
  if (
    isPrologue &&
    (state.studyDays !== 0 ||
      narrative.timeCapsules.some((c) => c.id === PROLOGUE.id))
  )
    return state;
  const capsule = {
    id: isPrologue
      ? PROLOGUE.id
      : `capsule:${recording.localRecordingReference}`,
    createdAt: now.instant,
    studyDay: state.studyDays,
    prompt: PROLOGUE.prompt,
    durationSeconds: recording.durationSeconds,
    localRecordingReference: recording.localRecordingReference,
    type: isPrologue ? ("prologue" as const) : ("checkpoint" as const),
  };
  return {
    ...state,
    narrative: {
      ...narrative,
      prologue: isPrologue
        ? { status: "saved", completedAt: now.instant }
        : narrative.prologue,
      timeCapsules: [...narrative.timeCapsules, capsule],
    },
  };
}
