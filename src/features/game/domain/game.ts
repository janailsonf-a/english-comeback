import type { GameSnapshot, RewardFeedback } from "../types";
import { awardXp } from "./legacyProgression";

export interface CompletionResult {
  snapshot: GameSnapshot;
  feedback: RewardFeedback | null;
}

export function activateQuest(
  snapshot: GameSnapshot,
  questId: string,
): GameSnapshot {
  const quest = snapshot.quests.find((item) => item.id === questId);
  if (!quest || quest.status !== "available") return snapshot;
  return {
    ...snapshot,
    quests: snapshot.quests.map((item) =>
      item.id === questId ? { ...item, status: "active" } : item,
    ),
  };
}

export function completeQuest(
  snapshot: GameSnapshot,
  questId: string,
): CompletionResult {
  const quest = snapshot.quests.find((item) => item.id === questId);
  if (!quest || !["available", "active"].includes(quest.status)) {
    return { snapshot, feedback: null };
  }
  const progression = awardXp(
    snapshot.player.level,
    snapshot.player.xp,
    quest.xpReward,
  );
  return {
    snapshot: {
      ...snapshot,
      player: {
        ...snapshot.player,
        level: progression.level,
        xp: progression.xp,
      },
      quests: snapshot.quests.map((item) =>
        item.id === questId ? { ...item, status: "completed" } : item,
      ),
    },
    feedback: {
      questId,
      xpAwarded: quest.xpReward,
      levelsGained: progression.levelsGained,
      level: progression.level,
    },
  };
}
