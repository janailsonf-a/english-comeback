import type { NarrativeState } from "./narrative/types";
export const CATEGORIES = [
  "Listening",
  "Speaking",
  "Vocabulary",
  "Grammar",
  "Reading",
  "Writing",
] as const;
export type ActivityCategory = (typeof CATEGORIES)[number];
export type Difficulty = "EASY" | "NORMAL" | "HARD";
export type CalendarDay = string;
export interface Clock {
  instant: string;
  day: CalendarDay;
}
export interface JourneyQuest {
  id: string;
  templateId: string;
  title: string;
  description: string;
  category: ActivityCategory;
  difficulty: Difficulty;
  duration: string;
  durationMinutes: number | null;
  objective: string;
  xpReward: number;
  status: "available" | "active" | "completed" | "locked";
  studyDay: number;
  completedAt: string | null;
  kind: "daily" | "return";
}
export interface StudySession {
  id: string;
  category: ActivityCategory;
  durationMinutes: number;
  source: "quest" | "return" | "boss";
  questId: string | null;
  completedAt: string;
  calendarDay: CalendarDay;
}
export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt: string | null;
  hidden: boolean;
}
export interface CompletedDay {
  studyDay: number;
  completedAt: string;
  calendarDay: CalendarDay;
}
export interface XpRecord {
  id: string;
  amount: number;
  source: "quest" | "day" | "boss" | "developer";
  completedAt: string;
}
export interface JourneyState {
  id: string;
  startedAt: string | null;
  startedDay: CalendarDay | null;
  level: number;
  xp: number;
  totalXpEarned: number;
  studyDays: number;
  quests: JourneyQuest[];
  completedDays: CompletedDay[];
  sessions: StudySession[];
  xpRecords: XpRecord[];
  achievements: Achievement[];
  streak: number;
  restTokens: number;
  tokenWeek: CalendarDay | null;
  consistencyThrough: CalendarDay | null;
  lastStudyDay: CalendarDay | null;
  lastActivityDay: CalendarDay | null;
  lastObservedDay: CalendarDay | null;
  comeback: "NORMAL" | "WELCOME_BACK" | "COMEBACK_MODE";
  boss: { completedSteps: string[]; defeatedAt: string | null };
  developmentData: boolean;
  narrative?: NarrativeState;
}
// Reserved for genuine assessments; never derived from XP or study minutes.
export interface SkillAssessment {
  id: string;
  skill: ActivityCategory;
  studyDay: number;
  assessedAt: string;
  method: string;
  result: string;
}
