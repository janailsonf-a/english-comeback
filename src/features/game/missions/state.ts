import type { MissionProgressState } from "./types";

export function initialMissionProgress(): MissionProgressState {
  return { active: null, attempts: [] };
}
