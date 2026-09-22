import { useState } from "react";
import { useGame } from "../../game/state/GameProvider";
export function useQuestInteraction() {
  const { snapshot, activateQuest, completeQuest } = useGame();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return {
    selectedQuest: snapshot?.quests.find((q) => q.id === selectedId) ?? null,
    openQuest: async (id: string) => {
      if (await activateQuest(id)) setSelectedId(id);
    },
    finishQuest: async (id: string) => {
      if (await completeQuest(id)) setSelectedId(null);
    },
    closeQuest: () => setSelectedId(null),
  };
}
