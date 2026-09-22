import { CAMPAIGN, WORLDS } from "../config";
export const SAGA = {
  id: "english-comeback",
  horizon: "THE NEW JOB",
  horizonStatus: "FINAL HORIZON",
  context:
    "A professional goal to work toward. English practice does not guarantee a job.",
} as const;
export const CAMPAIGNS = [
  {
    id: "awakening",
    numeral: "I",
    title: "THE AWAKENING",
    purpose: "Rebuild consistency, confidence and the habit of using English.",
    studyDays: CAMPAIGN.studyDays,
  },
  {
    id: "preparation",
    numeral: "II",
    title: "THE PREPARATION",
    purpose:
      "Use English professionally and prepare for technical conversations.",
    studyDays: null,
  },
  {
    id: "opportunity",
    numeral: "III",
    title: "THE OPPORTUNITY",
    purpose: "Prepare for interviews and international opportunities.",
    studyDays: null,
  },
] as const;
export const CHAPTERS = [
  {
    id: "the-return",
    numeral: "I",
    title: "THE RETURN",
    subtitle: "You decided to try again.",
    worldId: WORLDS[0].id,
    start: WORLDS[0].start,
    end: 7,
  },
  {
    id: "finding-your-voice",
    numeral: "II",
    title: "FINDING YOUR VOICE",
    subtitle: "Understanding isn't enough anymore. It's time to speak.",
    worldId: WORLDS[0].id,
    start: 8,
    end: WORLDS[0].end,
  },
  {
    id: "beyond-the-classroom",
    numeral: "III",
    title: "BEYOND THE CLASSROOM",
    subtitle: "English exists outside lessons.",
    worldId: WORLDS[1].id,
    start: WORLDS[1].start,
    end: WORLDS[1].end,
  },
] as const;
export const TITLES = [
  {
    id: "the-returner",
    title: "THE RETURNER",
    description: "Reach level 5.",
    requirement: { kind: "level", value: 5 },
  },
  {
    id: "voice-seeker",
    title: "VOICE SEEKER",
    description: "Record 30 minutes of Speaking practice.",
    requirement: { kind: "speaking", value: 30 },
  },
  {
    id: "silence-breaker",
    title: "SILENCE BREAKER",
    description: "Defeat THE SILENCE.",
    requirement: { kind: "boss", value: 1 },
  },
] as const;
export const PROLOGUE = {
  id: "capsule:prologue",
  title: "WHERE ARE YOU NOW?",
  prompt: "Tell me about yourself in English.",
} as const;
export const CAPSULE_CHECKPOINTS = [
  { studyDay: 1, prompt: "Tell me about yourself." },
  { studyDay: 14, prompt: "Tell me about yourself." },
  { studyDay: 30, prompt: "Tell me about yourself." },
] as const;
export const PROJECTION = {
  windowDays: 14,
  minimumObservedDays: 7,
  minimumDistinctStudyDates: 3,
} as const;

export const DEVELOPMENT_PACE = {
  advanceCalendarDays: 7,
  completionOffsets: [-6, -3, 0],
} as const;
