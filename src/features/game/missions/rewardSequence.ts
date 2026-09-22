import { CHAPTERS } from "../journey/narrative/config";
import type { RewardFeedback } from "../types";

export type RewardSequenceEvent =
  | { type: "MISSION_COMPLETE" }
  | { type: "QUEST_COMPLETE" }
  | { type: "BOSS_STEP_COMPLETE" }
  | { type: "BOSS_DEFEATED" }
  | { type: "LEVEL_UP" }
  | { type: "UNLOCKS" }
  | { type: "STUDY_DAY_COMPLETE" }
  | { type: "CHAPTER_ADVANCE" };

export function rewardSequence(
  feedback: RewardFeedback,
): RewardSequenceEvent[] {
  const hasUnlocks = Boolean(
    feedback.titleIds?.length || feedback.achievementIds?.length,
  );
  const standaloneUnlock =
    hasUnlocks &&
    feedback.xpAwarded === 0 &&
    !feedback.questTitle &&
    !feedback.missionId &&
    !feedback.bossDefeated &&
    !feedback.questId.startsWith("boss:");
  const events: RewardSequenceEvent[] = standaloneUnlock
    ? [{ type: "UNLOCKS" }]
    : [
        {
          type: feedback.bossDefeated
            ? "BOSS_DEFEATED"
            : feedback.missionId
              ? "MISSION_COMPLETE"
              : feedback.questId.startsWith("boss:")
                ? "BOSS_STEP_COMPLETE"
                : "QUEST_COMPLETE",
        },
      ];
  if (feedback.levelsGained > 0) events.push({ type: "LEVEL_UP" });
  if (hasUnlocks && !standaloneUnlock) events.push({ type: "UNLOCKS" });
  if (feedback.dayComplete) {
    events.push({ type: "STUDY_DAY_COMPLETE" });
    if (
      CHAPTERS.some(
        (chapter) =>
          chapter.end === feedback.dayComplete &&
          CHAPTERS.some(
            (next) =>
              next.start === chapter.end + 1 &&
              next.worldId === chapter.worldId,
          ),
      )
    )
      events.push({ type: "CHAPTER_ADVANCE" });
  }
  return events;
}
