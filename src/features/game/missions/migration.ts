import { CHAPTERS } from "../journey/narrative/config";
import { WORLDS } from "../journey/config";
import type { JourneyQuest, JourneyState } from "../journey/types";
import { missionDefinition } from "./content";
import { initialMissionProgress } from "./state";

const LEGACY_MISSIONS: Record<string, string> = {
  "train-your-ears": "train-your-ears",
  "speak-up": "break-the-silence",
  "knowledge-scroll": "knowledge-scroll",
  "grammar-dungeon": "grammar-dungeon",
  "tell-your-story": "tell-your-story",
  "quick-listen": "the-voice-message",
};

function enrichQuest(quest: JourneyQuest): JourneyQuest {
  if (quest.experience && quest.worldId && quest.chapterId) return quest;
  if (quest.kind === "return")
    return {
      ...quest,
      experience: "external",
      interactiveMissionId: null,
      worldId: WORLDS[0].id,
      chapterId: CHAPTERS[0].id,
    };
  const world = WORLDS.find(
    (candidate) =>
      quest.studyDay >= candidate.start && quest.studyDay <= candidate.end,
  );
  const chapter = CHAPTERS.find(
    (candidate) =>
      quest.studyDay >= candidate.start && quest.studyDay <= candidate.end,
  );
  const definition = missionDefinition(LEGACY_MISSIONS[quest.templateId] ?? "");
  if (!definition || !world || !chapter)
    return {
      ...quest,
      experience: "external",
      interactiveMissionId: null,
      worldId: world?.id ?? WORLDS[0].id,
      chapterId: chapter?.id ?? CHAPTERS[0].id,
    };
  // Completed schema-3 quests remain historical external confirmations. This
  // avoids inventing attempts or rewriting rewards already earned.
  if (quest.status === "completed" || definition.type === "EXTERNAL")
    return {
      ...quest,
      experience: "external",
      interactiveMissionId: null,
      worldId: world.id,
      chapterId: chapter.id,
    };
  return {
    ...quest,
    title: definition.title,
    description: definition.description,
    category: definition.category,
    difficulty: definition.difficulty,
    duration:
      definition.estimatedMinutes > 0
        ? `${definition.estimatedMinutes} min`
        : "1 lesson",
    durationMinutes:
      definition.estimatedMinutes > 0 ? definition.estimatedMinutes : null,
    objective: definition.objective,
    xpReward: definition.xpReward,
    experience: "interactive",
    interactiveMissionId: definition.id,
    worldId: world.id,
    chapterId: chapter.id,
  };
}

export function migrateMissionState(
  state: JourneyState,
  pauseInterrupted = false,
): JourneyState {
  const missions = state.missions ?? initialMissionProgress();
  const active =
    pauseInterrupted && missions.active?.status === "IN_PROGRESS"
      ? { ...missions.active, status: "PAUSED" as const }
      : missions.active;
  const quests = state.quests.map(enrichQuest);
  if (
    state.missions === missions &&
    active === missions.active &&
    quests.every((quest, index) => quest === state.quests[index])
  )
    return state;
  return { ...state, quests, missions: { ...missions, active } };
}
