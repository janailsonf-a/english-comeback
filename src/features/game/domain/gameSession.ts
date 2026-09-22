import {
  applyNarrativeAction,
  initialNarrative,
} from "../journey/narrative/rules";
import type { NarrativeAction } from "../journey/narrative/types";
import {
  applyDeveloperAction,
  type DeveloperAction,
} from "../journey/developerActions";
import type { ProgressStorage } from "../persistence/progressStorage";
import type { GameSnapshot } from "../types";
import { activateQuest, completeQuest, type CompletionResult } from "./game";
import {
  applyJourneyAction,
  emptyJourney,
  type JourneyAction,
} from "../journey/rules";
import { projectJourney } from "../journey/projectSnapshot";
import type { Clock } from "../journey/types";

// Publish a complete snapshot only after saving. Serialize all mutations and
// leave the previous state intact on failed writes, including reset/start.
export function createGameSession(
  initial: GameSnapshot,
  persistence: ProgressStorage,
) {
  let snapshot = initial;
  function legacyOnly(current: GameSnapshot) {
    if (current.journey?.startedAt)
      throw new Error("A reference clock is required for journey actions.");
  }
  let queue = Promise.resolve();
  function enqueue(
    compute: (current: GameSnapshot) => CompletionResult,
  ): Promise<CompletionResult> {
    const task = queue.then(async () => {
      const result = compute(snapshot);
      if (result.snapshot !== snapshot) {
        await persistence.save(result.snapshot);
        snapshot = result.snapshot;
      }
      return result;
    });
    queue = task.then(
      () => {},
      () => {},
    );
    return task;
  }
  function journey(action: JourneyAction, now: Clock) {
    return enqueue((current) => {
      const previous = current.journey ?? emptyJourney();
      const result = applyJourneyAction(previous, action, now);
      if (action.type === "start" && result.journey !== previous)
        result.journey = { ...result.journey, narrative: initialNarrative() };
      return {
        snapshot:
          result.journey === previous
            ? current
            : projectJourney(current, result.journey),
        feedback: result.feedback,
      };
    });
  }
  return {
    activateQuest: (questId: string, now?: Clock) =>
      now
        ? journey({ type: "activate", questId }, now)
        : enqueue((current) => {
            legacyOnly(current);
            return {
              snapshot: activateQuest(current, questId),
              feedback: null,
            };
          }),
    completeQuest: (questId: string, now?: Clock) =>
      now
        ? journey({ type: "complete", questId }, now)
        : enqueue((current) => {
            legacyOnly(current);
            return completeQuest(current, questId);
          }),
    journey,
    narrative: (action: NarrativeAction, now: Clock) =>
      enqueue((current) => {
        if (!current.journey) return { snapshot: current, feedback: null };
        const refreshed = applyJourneyAction(
          current.journey,
          { type: "refresh" },
          now,
        ).journey;
        const next = applyNarrativeAction(refreshed, action, now);
        return {
          snapshot:
            next === current.journey ? current : projectJourney(current, next),
          feedback: null,
        };
      }),
    developer: (action: DeveloperAction, now: Clock, enabled: boolean) =>
      enqueue((current) => {
        if (!current.journey) return { snapshot: current, feedback: null };
        const result = applyDeveloperAction(
          current.journey,
          action,
          now,
          enabled,
        );
        return {
          snapshot:
            result.journey === current.journey
              ? current
              : projectJourney(current, result.journey),
          feedback: result.feedback,
        };
      }),
  };
}
export type GameSession = ReturnType<typeof createGameSession>;
