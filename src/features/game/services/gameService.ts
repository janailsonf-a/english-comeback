import { mockGame } from "../data/mockGame";
import type { GameSnapshot } from "../types";

// Replace this adapter with an authenticated REST request when the backend exists.
// Components consume provider state and never import mock data.
export interface GameService {
  loadGame(): Promise<GameSnapshot>;
}

export const mockGameService: GameService = {
  async loadGame() {
    return {
      player: { ...mockGame.player },
      world: { ...mockGame.world },
      boss: { ...mockGame.boss },
      quests: mockGame.quests.map((quest) => ({ ...quest })),
    };
  },
};
