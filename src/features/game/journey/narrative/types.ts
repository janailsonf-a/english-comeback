export interface TimeCapsule {
  id: string;
  createdAt: string;
  studyDay: number;
  prompt: string;
  durationSeconds: number;
  localRecordingReference: string | null;
  type: "prologue" | "checkpoint" | "developer";
}
export interface UnlockedTitle {
  id: string;
  unlockedAt: string;
  source: "progress" | "developer";
}
export interface NarrativeState {
  campaignId: string;
  prologue: {
    status: "pending" | "saved" | "skipped" | "legacy";
    completedAt: string | null;
  };
  titles: UnlockedTitle[];
  equippedTitleId: string | null;
  timeCapsules: TimeCapsule[];
}
export interface RecordingDraft {
  localRecordingReference: string;
  durationSeconds: number;
}
export type NarrativeAction =
  | { type: "skipPrologue" }
  | { type: "saveCapsule"; recording: RecordingDraft }
  | { type: "equipTitle"; titleId: string | null };
