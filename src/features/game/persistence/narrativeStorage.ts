import { createJourneyStorage, validateJourney } from "./journeyStorage";
import type { KeyValueStorage, ProgressStorage } from "./progressStorage";
import { projectJourney } from "../journey/projectSnapshot";
import {
  migrateNarrative,
  validLocalRecordingReference,
} from "../journey/narrative/rules";
import type { NarrativeState } from "../journey/narrative/types";
import { TITLES, CAMPAIGNS, PROLOGUE } from "../journey/narrative/config";
export const NARRATIVE_STORAGE_KEY = "@english-comeback/narrative-v3";
export const NARRATIVE_SCHEMA_VERSION = 3;
function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function timestamp(value: unknown) {
  return (
    typeof value === "string" &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}
function unique(values: { id: string }[]) {
  return new Set(values.map((value) => value.id)).size === values.length;
}
function invalid(): never {
  throw new Error(
    "Invalid narrative save. The previous data has been preserved.",
  );
}
function validateNarrative(
  value: unknown,
  studyDays: number,
): asserts value is NarrativeState {
  if (
    !record(value) ||
    value.campaignId !== CAMPAIGNS[0].id ||
    !record(value.prologue) ||
    !["pending", "saved", "skipped", "legacy"].includes(
      String(value.prologue.status),
    ) ||
    !(
      value.prologue.completedAt === null ||
      timestamp(value.prologue.completedAt)
    ) ||
    !Array.isArray(value.titles) ||
    !Array.isArray(value.timeCapsules) ||
    !(
      value.equippedTitleId === null ||
      typeof value.equippedTitleId === "string"
    )
  )
    invalid();
  if (
    !value.titles.every(
      (title) =>
        record(title) &&
        TITLES.some((t) => t.id === title.id) &&
        timestamp(title.unlockedAt) &&
        ["progress", "developer"].includes(String(title.source)),
    )
  )
    invalid();
  if (
    !value.timeCapsules.every(
      (capsule) =>
        record(capsule) &&
        typeof capsule.id === "string" &&
        capsule.id.length > 0 &&
        timestamp(capsule.createdAt) &&
        typeof capsule.studyDay === "number" &&
        Number.isSafeInteger(capsule.studyDay) &&
        capsule.studyDay >= 0 &&
        typeof capsule.prompt === "string" &&
        capsule.prompt.length > 0 &&
        typeof capsule.durationSeconds === "number" &&
        Number.isFinite(capsule.durationSeconds) &&
        capsule.durationSeconds >= 0 &&
        capsule.durationSeconds <= 3600 &&
        ["prologue", "checkpoint", "developer"].includes(
          String(capsule.type),
        ) &&
        (capsule.type === "developer"
          ? capsule.localRecordingReference === null
          : typeof capsule.localRecordingReference === "string" &&
            validLocalRecordingReference(capsule.localRecordingReference) &&
            capsule.durationSeconds > 0),
    )
  )
    invalid();
  const narrative = value as unknown as NarrativeState;
  if (
    !unique(narrative.titles) ||
    !unique(narrative.timeCapsules) ||
    (narrative.equippedTitleId !== null &&
      !narrative.titles.some((title) => title.id === narrative.equippedTitleId))
  )
    invalid();
  const references = narrative.timeCapsules
    .filter((c) => c.localRecordingReference !== null)
    .map((c) => c.localRecordingReference);
  if (new Set(references).size !== references.length) invalid();
  if (
    narrative.timeCapsules.some((c) => c.studyDay > studyDays) ||
    (narrative.prologue.status === "pending" && studyDays !== 0)
  )
    invalid();
  const prologue = narrative.timeCapsules.filter((c) => c.type === "prologue");
  if (
    prologue.length > 1 ||
    prologue.some((c) => c.id !== PROLOGUE.id || c.studyDay !== 0) ||
    (narrative.prologue.status === "saved") !== (prologue.length === 1) ||
    ["saved", "skipped"].includes(narrative.prologue.status) !==
      Boolean(narrative.prologue.completedAt)
  )
    invalid();
}
export function createNarrativeStorage(
  storage: KeyValueStorage,
): ProgressStorage {
  const previous = createJourneyStorage(storage);
  return {
    async load(initial) {
      const raw = await storage.getItem(NARRATIVE_STORAGE_KEY);
      if (raw === null) {
        const old = await previous.load(initial);
        if (!old.journey) return old;
        const migrated = migrateNarrative(old.journey);
        validateJourney(migrated);
        validateNarrative(migrated.narrative, migrated.studyDays);
        await storage.setItem(
          NARRATIVE_STORAGE_KEY,
          JSON.stringify({
            schemaVersion: NARRATIVE_SCHEMA_VERSION,
            journey: migrated,
          }),
        );
        return projectJourney(old, migrated);
      }
      const envelope: unknown = JSON.parse(raw);
      if (
        !record(envelope) ||
        envelope.schemaVersion !== NARRATIVE_SCHEMA_VERSION
      )
        invalid();
      validateJourney(envelope.journey);
      validateNarrative(envelope.journey.narrative, envelope.journey.studyDays);
      return projectJourney(initial, envelope.journey);
    },
    async save(snapshot) {
      if (!snapshot.journey) return previous.save(snapshot);
      const journey = migrateNarrative(snapshot.journey);
      validateJourney(journey);
      validateNarrative(journey.narrative, journey.studyDays);
      await storage.setItem(
        NARRATIVE_STORAGE_KEY,
        JSON.stringify({ schemaVersion: NARRATIVE_SCHEMA_VERSION, journey }),
      );
    },
  };
}
