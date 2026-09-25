export interface VocabularyDefinition {
  id: string;
  term: string;
  meaning: string;
  example: string;
}

export const STARTER_VOCABULARY = [
  {
    id: "although",
    term: "although",
    meaning: "used to introduce a contrast",
    example: "Although the task was difficult, I finished it.",
  },
  {
    id: "reliable",
    term: "reliable",
    meaning: "someone or something you can trust",
    example: "She is a reliable teammate.",
  },
  {
    id: "meet-a-deadline",
    term: "meet a deadline",
    meaning: "finish work by the required time",
    example: "We need to meet the deadline.",
  },
  {
    id: "issue",
    term: "issue",
    meaning: "a problem that needs attention",
    example: "We found an issue in the API.",
  },
  {
    id: "improve",
    term: "improve",
    meaning: "make or become better",
    example: "I want to improve my English.",
  },
] as const satisfies readonly VocabularyDefinition[];

export interface MissionVocabularyBinding {
  missionId: string;
  steps: Readonly<Record<string, string>>;
}

export const MISSION_VOCABULARY = [
  {
    missionId: "memory-battle",
    steps: { although: "although", reliable: "reliable" },
  },
  {
    missionId: "choose-your-word",
    steps: { deadline: "meet-a-deadline", issue: "issue" },
  },
  {
    missionId: "use-your-weapon",
    steps: { improve: "improve", "use-improve": "improve" },
  },
] as const satisfies readonly MissionVocabularyBinding[];

export const REVIEW_INTERVAL_DAYS = {
  first: 1,
  second: 3,
  third: 7,
  mastered: 30,
} as const;

export function vocabularyIdForMissionStep(
  missionId: string,
  stepId: string,
) {
  const binding = MISSION_VOCABULARY.find(
    (candidate) => candidate.missionId === missionId,
  );
  return binding
    ? (binding.steps as Readonly<Record<string, string>>)[stepId] ?? null
    : null;
}
