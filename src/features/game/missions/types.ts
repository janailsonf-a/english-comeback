import type {
  ActivityCategory,
  CalendarDay,
  Difficulty,
} from "../journey/types";

export type MissionType =
  "SPEAKING" | "LISTENING" | "READING" | "VOCABULARY" | "EXTERNAL";

export type MissionStatus =
  "AVAILABLE" | "IN_PROGRESS" | "PAUSED" | "COMPLETED";

export interface MissionOption {
  id: string;
  label: string;
}

export type MissionStep =
  | { id: string; kind: "PROMPT"; prompt: string }
  | {
      id: string;
      kind: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "FILL_GAP";
      prompt: string;
      options: MissionOption[];
      correctOptionId: string;
      explanation: string;
    }
  | {
      id: string;
      kind: "MANUAL_PRACTICE";
      prompt: string;
      example?: string;
    };

export interface MissionDefinition {
  id: string;
  type: MissionType;
  category: ActivityCategory;
  title: string;
  subtitle: string;
  description: string;
  narrative: string;
  objective: string;
  difficulty: Difficulty;
  xpReward: number;
  estimatedMinutes: number;
  minimumActiveSeconds: number;
  steps: readonly MissionStep[];
  passage?: string;
  audioAssetId?: "daniel-intro" | "meeting-message";
  externalProvider?: string;
}

export interface MissionAnswer {
  stepId: string;
  value: string;
  correct: boolean | null;
  answeredAt: string;
}

export interface MissionRun {
  attemptId: string;
  missionId: string;
  questId: string;
  status: "IN_PROGRESS" | "PAUSED";
  currentStep: number;
  startedAt: string;
  elapsedSeconds: number;
  answers: MissionAnswer[];
  audioPlayed: boolean;
  studyDay: number;
  worldId: string;
  chapterId: string;
}

export interface MissionAttempt {
  id: string;
  missionId: string;
  questId: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  answers: MissionAnswer[];
  result: "COMPLETED";
  studyDay: number;
  calendarDay: CalendarDay;
  worldId: string;
  chapterId: string;
  localRecordingReference: string | null;
  development: boolean;
}

export interface MissionProgressState {
  active: MissionRun | null;
  attempts: MissionAttempt[];
}

export interface MissionRecording {
  localRecordingReference: string;
  durationSeconds: number;
}

export type MissionAction =
  | { type: "start"; questId: string }
  | { type: "resume"; questId: string }
  | { type: "pause"; questId: string; elapsedSeconds: number }
  | {
      type: "answer";
      questId: string;
      stepId: string;
      value: string;
      elapsedSeconds: number;
    }
  | {
      type: "advance";
      questId: string;
      stepId: string;
      elapsedSeconds: number;
    }
  | { type: "audioPlayed"; questId: string }
  | {
      type: "complete";
      questId: string;
      elapsedSeconds: number;
      recording?: MissionRecording;
      developerBypass?: boolean;
    }
  | { type: "reset"; questId: string; developerBypass?: boolean };
