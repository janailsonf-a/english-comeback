import { awardXp } from "../domain/progression";
import { effortMetrics } from "./selectors";
import type { Clock, JourneyState } from "./types";

export function unlockAchievements(
  state: JourneyState,
  now: Clock,
): JourneyState {
  const metrics = effortMetrics(state);
  const requirements: Record<string, boolean> = {
    "first-step": metrics.questsCompleted >= 1,
    "on-fire": state.studyDays >= 7,
    "speak-up": metrics.minutesByCategory.Speaking >= 30,
    "all-ears": metrics.minutesByCategory.Listening >= 60,
    "boss-slayer": metrics.bossesDefeated >= 1,
    "i-found-my-voice": Boolean(state.boss.defeatedAt),
    scholar: metrics.questsCompleted >= 50,
  };
  return {
    ...state,
    achievements: state.achievements.map((a) =>
      !a.unlocked && requirements[a.id]
        ? { ...a, unlocked: true, unlockedAt: now.instant }
        : a,
    ),
  };
}
export function grantXp(
  state: JourneyState,
  amount: number,
  id: string,
  source: JourneyState["xpRecords"][number]["source"],
  now: Clock,
): JourneyState {
  if (state.xpRecords.some((record) => record.id === id)) return state;
  const progression = awardXp(state.level, state.xp, amount);
  return {
    ...state,
    level: progression.level,
    xp: progression.xp,
    totalXpEarned: state.totalXpEarned + amount,
    xpRecords: [
      ...state.xpRecords,
      { id, amount, source, completedAt: now.instant },
    ],
  };
}
