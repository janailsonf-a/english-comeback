import { addCalendarDays, weekStart } from "./calendar";
import {
  ACHIEVEMENTS,
  CAMPAIGN,
  QUEST_POOL,
  QUEST_REWARDS,
  WORLDS,
} from "./config";
import type { Clock, JourneyQuest, JourneyState } from "./types";

export function emptyJourney(): JourneyState {
  return {
    id: "not-started",
    startedAt: null,
    startedDay: null,
    level: 1,
    xp: 0,
    totalXpEarned: 0,
    studyDays: 0,
    quests: [],
    completedDays: [],
    sessions: [],
    xpRecords: [],
    achievements: ACHIEVEMENTS.map((a) => ({
      ...a,
      unlocked: false,
      unlockedAt: null,
      hidden: false,
    })),
    streak: 0,
    restTokens: CAMPAIGN.restTokens.initial,
    tokenWeek: null,
    consistencyThrough: null,
    lastStudyDay: null,
    lastActivityDay: null,
    lastObservedDay: null,
    comeback: "NORMAL",
    boss: { completedSteps: [], defeatedAt: null },
    developmentData: false,
  };
}
export function questsForDay(studyDay: number): JourneyQuest[] {
  if (!Number.isSafeInteger(studyDay))
    throw new RangeError("Study Day must be an integer.");
  if (studyDay < WORLDS[0].start || studyDay > WORLDS[0].end) return [];
  // Rotate two non-repeating trios, then rotate their order between days.
  const start = ((studyDay - 1) % 2) * CAMPAIGN.dailyQuestCount;
  const trio = QUEST_POOL.slice(start, start + CAMPAIGN.dailyQuestCount);
  const offset = Math.floor((studyDay - 1) / 2) % trio.length;
  return trio
    .map((_, index) => trio[(index + offset) % trio.length])
    .map((template) => ({
      id: `day-${studyDay}:${template.id}`,
      templateId: template.id,
      title: template.title,
      description: template.description,
      category: template.category,
      difficulty: template.difficulty,
      duration: template.duration,
      durationMinutes: template.minutes,
      objective: template.description,
      xpReward: QUEST_REWARDS[template.difficulty],
      status: "available",
      studyDay,
      completedAt: null,
      kind: "daily",
    }));
}
export function startJourney(now: Clock): JourneyState {
  return {
    ...emptyJourney(),
    id: `journey-${now.instant}`,
    startedAt: now.instant,
    startedDay: now.day,
    lastActivityDay: now.day,
    lastObservedDay: now.day,
    tokenWeek: weekStart(now.day),
    consistencyThrough: addCalendarDays(now.day, -1),
    quests: questsForDay(1),
  };
}
