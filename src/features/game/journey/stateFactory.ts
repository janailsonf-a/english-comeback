import { addCalendarDays, weekStart } from "./calendar";
import { ACHIEVEMENTS, CAMPAIGN, WORLDS } from "./config";
import { CHAPTERS } from "./narrative/config";
import { missionDefinition, missionsForStudyDay } from "../missions/content";
import { initialMissionProgress } from "../missions/state";
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
    missions: initialMissionProgress(),
  };
}
export function questsForDay(studyDay: number): JourneyQuest[] {
  if (!Number.isSafeInteger(studyDay))
    throw new RangeError("Study Day must be an integer.");
  if (studyDay < WORLDS[0].start || studyDay > WORLDS[0].end) return [];
  const world = WORLDS.find(
    (candidate) => studyDay >= candidate.start && studyDay <= candidate.end,
  );
  const chapter = CHAPTERS.find(
    (candidate) => studyDay >= candidate.start && studyDay <= candidate.end,
  );
  return missionsForStudyDay(studyDay).map((scheduled) => {
    const mission = missionDefinition(scheduled.missionId);
    if (!mission || !world || !chapter)
      throw new Error("Invalid mission schedule configuration.");
    const interactive = mission.type !== "EXTERNAL";
    return {
      id: `day-${studyDay}:${scheduled.templateId}`,
      templateId: scheduled.templateId,
      title: mission.title,
      description: mission.description,
      category: mission.category,
      difficulty: mission.difficulty,
      duration:
        mission.estimatedMinutes > 0
          ? `${mission.estimatedMinutes} min`
          : "1 lesson",
      durationMinutes:
        mission.estimatedMinutes > 0 ? mission.estimatedMinutes : null,
      objective: mission.objective,
      xpReward: mission.xpReward,
      status: "available",
      studyDay,
      completedAt: null,
      kind: "daily",
      experience: interactive ? "interactive" : "external",
      interactiveMissionId: interactive ? mission.id : null,
      worldId: world.id,
      chapterId: chapter.id,
    } satisfies JourneyQuest;
  });
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
