import { equippedTitle } from "./narrative/selectors";
import type { GameSnapshot } from "../types";
import { CAMPAIGN, SILENCE } from "./config";
import { currentWorld, dailyQuests, specialQuests } from "./selectors";
import type { JourneyState } from "./types";
export function projectJourney(
  initial: GameSnapshot,
  journey: JourneyState,
): GameSnapshot {
  const world = currentWorld(journey);
  return {
    ...initial,
    journey,
    player: {
      ...initial.player,
      level: journey.level,
      xp: journey.xp,
      streak: journey.streak,
      title: equippedTitle(journey) ?? "The returning adventurer",
    },
    world: {
      id: world.id,
      number: world.number,
      name: world.name,
      tagline: world.subtitle,
      day: journey.studyDays,
      journeyDays: CAMPAIGN.studyDays,
    },
    quests: [...dailyQuests(journey), ...specialQuests(journey)].map((q) => ({
      ...q,
      optional: q.kind !== "daily",
    })),
    boss: {
      ...initial.boss,
      name: SILENCE.name,
      description: SILENCE.objective,
      difficulty: "World 01 · final challenge",
    },
  };
}
