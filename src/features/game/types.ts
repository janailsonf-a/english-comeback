import type { JourneyState } from "./journey/types";
export type QuestStatus = "available" | "active" | "completed" | "locked";
export type QuestCategory =
  | "Listening"
  | "Speaking"
  | "Study"
  | "Grammar"
  | "Vocabulary"
  | "Reading"
  | "Writing";

export interface Player {
  id: string;
  name: string;
  title: string;
  level: number;
  xp: number;
  streak: number;
}

export interface Quest {
  id: string;
  title: string;
  category: QuestCategory;
  duration: string;
  description: string;
  objective: string;
  xpReward: number;
  status: QuestStatus;
  optional: boolean;
  difficulty?: "EASY" | "NORMAL" | "HARD";
  studyDay?: number;
  completedAt?: string | null;
  experience?: "interactive" | "external";
  interactiveMissionId?: string | null;
}

export interface WorldPreview {
  id: string;
  number: number;
  name: string;
  tagline: string;
  day: number;
  journeyDays: number;
}

// Projected Boss data used by Home while the Journey owns battle state.
export interface BossPreview {
  id: string;
  name: string;
  description: string;
  unlockLevel: number;
  difficulty: string;
}

export interface GameSnapshot {
  player: Player;
  quests: Quest[];
  world: WorldPreview;
  boss: BossPreview;
  journey?: JourneyState;
}

export interface RewardFeedback {
  questId: string;
  xpAwarded: number;
  levelsGained: number;
  level: number;
  dayComplete?: number;
  bossDefeated?: boolean;
  achievementIds?: string[];
  titleIds?: string[];
  questTitle?: string;
  category?: string;
  dailyCompleted?: number;
  dailyTotal?: number;
  chapterDay?: number;
  missionId?: string;
  missionType?: "SPEAKING" | "LISTENING" | "READING" | "VOCABULARY";
  missionXp?: number;
  missionDurationMinutes?: number;
  missionRecordingReference?: string | null;
}
