import {
  activateQuest,
  completeQuest,
  type CompletionResult,
} from "../domain/game";
import type { GameSnapshot, RewardFeedback } from "../types";

export interface GameState {
  snapshot: GameSnapshot | null;
  feedback: RewardFeedback | null;
  error: string | null;
}

export type GameAction =
  | ({ type: "committed" } & CompletionResult)
  | { type: "loaded"; snapshot: GameSnapshot }
  | { type: "loadFailed"; error: string }
  | { type: "activate"; questId: string }
  | { type: "complete"; questId: string }
  | { type: "dismissFeedback"; questId: string };

export const initialGameState: GameState = {
  snapshot: null,
  feedback: null,
  error: null,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "committed":
      return {
        ...state,
        snapshot: action.snapshot,
        feedback:
          action.snapshot.journey &&
          (!action.snapshot.journey.startedAt ||
            action.snapshot.journey.id !== state.snapshot?.journey?.id)
            ? action.feedback
            : (action.feedback ?? state.feedback),
      };
    case "loaded":
      return { snapshot: action.snapshot, feedback: null, error: null };
    case "loadFailed":
      return { ...state, error: action.error };
    case "dismissFeedback":
      return state.feedback?.questId === action.questId
        ? { ...state, feedback: null }
        : state;
    case "activate":
      return state.snapshot
        ? { ...state, snapshot: activateQuest(state.snapshot, action.questId) }
        : state;
    case "complete": {
      if (!state.snapshot) return state;
      const result = completeQuest(state.snapshot, action.questId);
      // Duplicate taps are idempotent, including when React batches actions.
      return result.feedback
        ? { ...state, snapshot: result.snapshot, feedback: result.feedback }
        : state;
    }
  }
}
