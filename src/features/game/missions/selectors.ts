import type { JourneyQuest, JourneyState } from "../journey/types";
import { missionDefinition } from "./content";
import type {
  MissionDefinition,
  MissionRun,
  MissionStatus,
  MissionStep,
} from "./types";

export function questMission(
  quest: JourneyQuest | undefined,
): MissionDefinition | null {
  return quest?.interactiveMissionId
    ? missionDefinition(quest.interactiveMissionId)
    : null;
}

export function missionStatus(
  journey: JourneyState,
  quest: JourneyQuest,
): MissionStatus {
  if (quest.status === "completed") return "COMPLETED";
  const active = journey.missions?.active;
  if (active?.questId === quest.id) return active.status;
  return "AVAILABLE";
}

export function activeMissionDefinition(journey: JourneyState) {
  return journey.missions?.active
    ? missionDefinition(journey.missions.active.missionId)
    : null;
}

export function currentMissionStep(
  definition: MissionDefinition,
  run: MissionRun,
): MissionStep | null {
  return definition.steps[run.currentStep] ?? null;
}

export function answeredStep(run: MissionRun, stepId: string) {
  return run.answers.find((answer) => answer.stepId === stepId) ?? null;
}

export function missionCanAdvance(
  definition: MissionDefinition,
  run: MissionRun,
) {
  const step = currentMissionStep(definition, run);
  if (!step) return false;
  return step.kind === "PROMPT" || Boolean(answeredStep(run, step.id));
}

export function missionCompletion(
  definition: MissionDefinition,
  run: MissionRun,
  elapsedSeconds: number,
) {
  const atFinalStep = run.currentStep === definition.steps.length - 1;
  const allAnswered = definition.steps.every(
    (step) => step.kind === "PROMPT" || Boolean(answeredStep(run, step.id)),
  );
  const audioReady = definition.type !== "LISTENING" || run.audioPlayed;
  const timeReady = elapsedSeconds >= definition.minimumActiveSeconds;
  return {
    allowed: atFinalStep && allAnswered && audioReady && timeReady,
    atFinalStep,
    allAnswered,
    audioReady,
    timeReady,
    remainingSeconds: Math.max(
      0,
      definition.minimumActiveSeconds - elapsedSeconds,
    ),
  };
}

export function interactiveMissionsCompleted(journey: JourneyState) {
  return (
    journey.missions?.attempts.filter((attempt) => !attempt.development)
      .length ?? 0
  );
}

export function bossPreparation(journey: JourneyState) {
  const completed =
    journey.missions?.attempts.filter(
      (attempt) => missionDefinition(attempt.missionId)?.type === "SPEAKING",
    ).length ?? 0;
  return { completed: Math.min(5, completed), target: 5 };
}
