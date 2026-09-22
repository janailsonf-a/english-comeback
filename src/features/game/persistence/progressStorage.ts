import { xpRequiredForLevel } from "../domain/legacyProgression";
import type { GameSnapshot, QuestStatus } from "../types";

export const PROGRESS_STORAGE_KEY = "@english-comeback/progress";
const SCHEMA_VERSION = 1;
const questStatuses: readonly QuestStatus[] = [
  "available",
  "active",
  "completed",
  "locked",
];

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export interface ProgressStorage {
  load(initial: GameSnapshot): Promise<GameSnapshot>;
  save(snapshot: GameSnapshot): Promise<void>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function restoreProgress(raw: string, initial: GameSnapshot): GameSnapshot {
  const data: unknown = JSON.parse(raw);
  if (
    !isRecord(data) ||
    data.schemaVersion !== SCHEMA_VERSION ||
    data.playerId !== initial.player.id ||
    typeof data.level !== "number" ||
    !Number.isSafeInteger(data.level) ||
    data.level < 1 ||
    typeof data.xp !== "number" ||
    !Number.isSafeInteger(data.xp) ||
    data.xp < 0 ||
    !Array.isArray(data.quests)
  ) {
    throw new Error("Invalid saved progress.");
  }
  const requirement = xpRequiredForLevel(data.level);
  if (!Number.isSafeInteger(requirement) || data.xp >= requirement) {
    throw new Error("Invalid saved XP.");
  }
  const statuses = new Map<string, QuestStatus>();
  for (const quest of data.quests) {
    if (
      !isRecord(quest) ||
      typeof quest.id !== "string" ||
      !quest.id ||
      typeof quest.status !== "string" ||
      !questStatuses.includes(quest.status as QuestStatus) ||
      statuses.has(quest.id)
    ) {
      throw new Error("Invalid saved quest.");
    }
    statuses.set(quest.id, quest.status as QuestStatus);
  }
  return {
    ...initial,
    player: { ...initial.player, level: data.level, xp: data.xp },
    // Text, rewards and previews always come from the current data adapter.
    quests: initial.quests.map((quest) => ({
      ...quest,
      status: statuses.get(quest.id) ?? quest.status,
    })),
  };
}

export function createProgressStorage(
  storage: KeyValueStorage,
): ProgressStorage {
  return {
    async load(initial) {
      const raw = await storage.getItem(PROGRESS_STORAGE_KEY);
      // Read failures or unsupported data propagate: never overwrite a saved
      // journey with the defaults simply because restoration failed.
      return raw === null ? initial : restoreProgress(raw, initial);
    },
    async save(snapshot) {
      await storage.setItem(
        PROGRESS_STORAGE_KEY,
        JSON.stringify({
          schemaVersion: SCHEMA_VERSION,
          playerId: snapshot.player.id,
          level: snapshot.player.level,
          xp: snapshot.player.xp,
          quests: snapshot.quests.map(({ id, status }) => ({ id, status })),
        }),
      );
    },
  };
}
