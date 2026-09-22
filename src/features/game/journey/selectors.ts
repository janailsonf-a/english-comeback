import { inactivityDays } from "./calendar";
import { CAMPAIGN, SILENCE, WORLDS } from "./config";
import type { ActivityCategory, JourneyState } from "./types";
export function currentWorld(journey: JourneyState) {
  return journey.boss.defeatedAt ? WORLDS[1] : WORLDS[0];
}
export function worldStatus(
  journey: JourneyState,
  id: string,
): "LOCKED" | "CURRENT" | "COMPLETED" | "UNLOCKED" {
  if (id === WORLDS[0].id)
    return journey.boss.defeatedAt ? "COMPLETED" : "CURRENT";
  if (id === WORLDS[1].id && journey.boss.defeatedAt) return "UNLOCKED";
  return "LOCKED";
}
export function dailyQuests(journey: JourneyState) {
  return journey.quests.filter(
    (q) => q.kind === "daily" && q.studyDay === journey.studyDays + 1,
  );
}
export function specialQuests(journey: JourneyState) {
  return journey.quests.filter(
    (q) => q.kind === "return" && q.status !== "completed",
  );
}
export function bossHp(journey: JourneyState) {
  return Math.max(
    0,
    SILENCE.hp -
      SILENCE.steps
        .filter((step) => journey.boss.completedSteps.includes(step.id))
        .reduce((hp, step) => hp + step.damage, 0),
  );
}
export function effortMetrics(
  journey: JourneyState,
  today?: string,
  windowDays?: number,
) {
  const sessions = journey.sessions.filter(
    (s) =>
      !today ||
      !windowDays ||
      (inactivityDays(s.calendarDay, today) < windowDays &&
        s.calendarDay <= today),
  );
  const minutesByCategory: Record<ActivityCategory, number> = {
    Speaking: 0,
    Listening: 0,
    Reading: 0,
    Writing: 0,
    Grammar: 0,
    Vocabulary: 0,
  };
  for (const session of sessions)
    minutesByCategory[session.category] += session.durationMinutes;
  return {
    minutesByCategory,
    totalMinutes: sessions.reduce((sum, s) => sum + s.durationMinutes, 0),
    questsCompleted: journey.quests.filter((q) => q.status === "completed")
      .length,
    bossesDefeated: journey.boss.defeatedAt ? 1 : 0,
    achievements: journey.achievements.filter((a) => a.unlocked).length,
    studyDays: journey.studyDays,
    campaignDays: CAMPAIGN.studyDays,
  };
}
