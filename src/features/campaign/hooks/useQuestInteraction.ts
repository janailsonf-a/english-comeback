import { useRouter } from "expo-router";
import { useState } from "react";
import { useGame } from "../../game/state/GameProvider";

export function useQuestInteraction() {
  const { snapshot, activateQuest, completeQuest } = useGame();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return {
    selectedQuest: snapshot?.quests.find((q) => q.id === selectedId) ?? null,
    openQuest: async (id: string) => {
      const quest = snapshot?.quests.find((candidate) => candidate.id === id);
      if (!quest || quest.status === "completed" || quest.status === "locked")
        return;
      if (quest.experience === "interactive") {
        router.push({
          pathname: "/mission/[questId]",
          params: { questId: id },
        });
        return;
      }
      if (await activateQuest(id)) setSelectedId(id);
    },
    finishQuest: async (id: string) => {
      if (await completeQuest(id)) setSelectedId(null);
    },
    closeQuest: () => setSelectedId(null),
  };
}
