import { applyJourneyAction, type JourneyResult } from "../journey/rules";
import { validLocalRecordingReference } from "../journey/narrative/rules";
import type { Clock, JourneyState } from "../journey/types";
import { missionDefinition } from "./content";
import {
  answeredStep,
  currentMissionStep,
  missionCanAdvance,
  missionCompletion,
} from "./selectors";
import type {
  MissionAction,
  MissionAnswer,
  MissionAttempt,
  MissionRun,
} from "./types";
import { applyMissionLearning } from "../learning/rules";

function unchanged(journey: JourneyState): JourneyResult {
  return { journey, feedback: null };
}

function validElapsed(value: number) {
  return Number.isFinite(value) && value >= 0 && value <= 14_400;
}

function elapsed(run: MissionRun, value: number) {
  if (!validElapsed(value)) return null;
  return Math.max(run.elapsedSeconds, Math.floor(value));
}

function updateActive(
  state: JourneyState,
  active: MissionRun | null,
): JourneyState {
  return {
    ...state,
    missions: {
      active,
      attempts: state.missions?.attempts ?? [],
    },
  };
}

export function applyMissionAction(
  state: JourneyState,
  action: MissionAction,
  now: Clock,
): JourneyResult {
  if (
    !state.startedAt ||
    !state.missions ||
    now.day < (state.lastObservedDay ?? now.day)
  )
    return unchanged(state);
  const quest = state.quests.find(
    (candidate) => candidate.id === action.questId,
  );
  const definition = quest?.interactiveMissionId
    ? missionDefinition(quest.interactiveMissionId)
    : null;
  if (!quest || !definition || definition.type === "EXTERNAL")
    return unchanged(state);

  if (action.type === "start") {
    if (
      state.missions.active ||
      !["available", "active"].includes(quest.status) ||
      (quest.kind === "daily" && quest.studyDay !== state.studyDays + 1)
    )
      return unchanged(state);
    const activated =
      quest.status === "available"
        ? applyJourneyAction(
            state,
            { type: "activate", questId: quest.id },
            now,
          ).journey
        : state;
    if (
      activated.quests.find((candidate) => candidate.id === quest.id)
        ?.status !== "active"
    )
      return unchanged(state);
    const run: MissionRun = {
      attemptId: `attempt:${state.id}:${quest.id}:${now.instant}`,
      missionId: definition.id,
      questId: quest.id,
      status: "IN_PROGRESS",
      currentStep: 0,
      startedAt: now.instant,
      elapsedSeconds: 0,
      answers: [],
      audioPlayed: false,
      studyDay: quest.studyDay,
      worldId: quest.worldId ?? "the-comeback",
      chapterId: quest.chapterId ?? "the-return",
    };
    return { journey: updateActive(activated, run), feedback: null };
  }

  const run = state.missions.active;
  if (!run || run.questId !== quest.id || run.missionId !== definition.id)
    return unchanged(state);

  if (action.type === "resume") {
    return run.status !== "PAUSED"
      ? unchanged(state)
      : {
          journey: updateActive(state, { ...run, status: "IN_PROGRESS" }),
          feedback: null,
        };
  }

  if (action.type === "pause") {
    const nextElapsed = elapsed(run, action.elapsedSeconds);
    return run.status !== "IN_PROGRESS" || nextElapsed === null
      ? unchanged(state)
      : {
          journey: updateActive(state, {
            ...run,
            status: "PAUSED",
            elapsedSeconds: nextElapsed,
          }),
          feedback: null,
        };
  }

  if (action.type === "reset") {
    if (!action.developerBypass || !state.developmentData)
      return unchanged(state);
    return {
      journey: updateActive(
        {
          ...state,
          quests: state.quests.map((candidate) =>
            candidate.id === quest.id && candidate.status === "active"
              ? { ...candidate, status: "available" }
              : candidate,
          ),
        },
        null,
      ),
      feedback: null,
    };
  }

  if (run.status !== "IN_PROGRESS") return unchanged(state);

  if (action.type === "audioPlayed") {
    if (definition.type !== "LISTENING" || run.audioPlayed)
      return unchanged(state);
    return {
      journey: updateActive(state, { ...run, audioPlayed: true }),
      feedback: null,
    };
  }

  if (action.type === "answer") {
    const step = currentMissionStep(definition, run);
    const nextElapsed = elapsed(run, action.elapsedSeconds);
    if (
      !step ||
      step.id !== action.stepId ||
      step.kind === "PROMPT" ||
      answeredStep(run, step.id) ||
      nextElapsed === null
    )
      return unchanged(state);
    const value = action.value.trim();
    if (!value) return unchanged(state);
    let correct: boolean | null = null;
    if (step.kind !== "MANUAL_PRACTICE") {
      if (!step.options.some((option) => option.id === value))
        return unchanged(state);
      correct = value === step.correctOptionId;
    }
    const answer: MissionAnswer = {
      stepId: step.id,
      value,
      correct,
      answeredAt: now.instant,
    };
    return {
      journey: updateActive(state, {
        ...run,
        elapsedSeconds: nextElapsed,
        answers: [...run.answers, answer],
      }),
      feedback: null,
    };
  }

  if (action.type === "advance") {
    const step = currentMissionStep(definition, run);
    const nextElapsed = elapsed(run, action.elapsedSeconds);
    if (
      !step ||
      step.id !== action.stepId ||
      !missionCanAdvance(definition, run) ||
      run.currentStep >= definition.steps.length - 1 ||
      nextElapsed === null
    )
      return unchanged(state);
    return {
      journey: updateActive(state, {
        ...run,
        currentStep: run.currentStep + 1,
        elapsedSeconds: nextElapsed,
      }),
      feedback: null,
    };
  }

  const nextElapsed = elapsed(run, action.elapsedSeconds);
  if (nextElapsed === null) return unchanged(state);
  const bypass = Boolean(action.developerBypass && state.developmentData);
  if (!bypass && !missionCompletion(definition, run, nextElapsed).allowed)
    return unchanged(state);
  if (
    action.recording &&
    (definition.type !== "SPEAKING" ||
      !validLocalRecordingReference(action.recording.localRecordingReference) ||
      !Number.isFinite(action.recording.durationSeconds) ||
      action.recording.durationSeconds <= 0 ||
      action.recording.durationSeconds > 14_400)
  )
    return unchanged(state);
  const finalElapsed = Math.max(
    1,
    bypass
      ? Math.max(nextElapsed, definition.estimatedMinutes * 60)
      : nextElapsed,
  );
  const attempt: MissionAttempt = {
    id: run.attemptId,
    missionId: definition.id,
    questId: quest.id,
    startedAt: run.startedAt,
    completedAt: now.instant,
    durationSeconds: finalElapsed,
    answers: run.answers,
    result: "COMPLETED",
    studyDay: quest.studyDay,
    calendarDay: now.day,
    worldId: run.worldId,
    chapterId: run.chapterId,
    localRecordingReference: action.recording?.localRecordingReference ?? null,
    development: bypass,
  };
  const withAttempt: JourneyState = {
    ...state,
    developmentData: state.developmentData || bypass,
    missions: {
      active: null,
      attempts: [...state.missions.attempts, attempt],
    },
  };
  const withLearning = applyMissionLearning(withAttempt, attempt);
  const result = applyJourneyAction(
    withLearning,
    { type: "completeMission", questId: quest.id, attemptId: attempt.id },
    now,
  );
  if (!result.feedback) return unchanged(state);
  return {
    journey: result.journey,
    feedback: {
      ...result.feedback,
      missionId: definition.id,
      missionType: definition.type,
      missionXp: definition.xpReward,
      missionDurationMinutes: Math.max(1, Math.ceil(finalElapsed / 60)),
      missionRecordingReference: attempt.localRecordingReference,
    },
  };
}

export function pauseInterruptedMission(state: JourneyState) {
  const active = state.missions?.active;
  if (!active || active.status !== "IN_PROGRESS") return state;
  return updateActive(state, { ...active, status: "PAUSED" });
}
