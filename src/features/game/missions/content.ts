import { QUEST_REWARDS } from "../journey/config";
import type { MissionDefinition } from "./types";

export const MISSION_DEFINITIONS = [
  {
    id: "break-the-silence",
    type: "SPEAKING",
    category: "Speaking",
    title: "Break the Silence",
    subtitle: "Your voice is your weapon.",
    description: "Use four prompts to speak continuously in English.",
    narrative: "The path opens when you use your voice.",
    objective: "Speak English for 3 minutes.",
    difficulty: "NORMAL",
    xpReward: 30,
    estimatedMinutes: 3,
    minimumActiveSeconds: 180,
    steps: [
      { id: "introduce", kind: "PROMPT", prompt: "Introduce yourself." },
      { id: "work", kind: "PROMPT", prompt: "What do you do?" },
      {
        id: "free-time",
        kind: "PROMPT",
        prompt: "What do you like doing in your free time?",
      },
      {
        id: "motivation",
        kind: "PROMPT",
        prompt: "Why are you learning English?",
      },
    ],
  },
  {
    id: "tell-your-story",
    type: "SPEAKING",
    category: "Speaking",
    title: "Tell Your Story",
    subtitle: "A small story makes your voice stronger.",
    description: "Talk through the beginning, middle and end of your day.",
    narrative: "Every adventurer carries a story worth telling.",
    objective: "Talk about your day for 3 minutes.",
    difficulty: "NORMAL",
    xpReward: QUEST_REWARDS.NORMAL,
    estimatedMinutes: 3,
    minimumActiveSeconds: 180,
    steps: [
      { id: "morning", kind: "PROMPT", prompt: "How did your day begin?" },
      {
        id: "moment",
        kind: "PROMPT",
        prompt: "What was an important moment today?",
      },
      { id: "tomorrow", kind: "PROMPT", prompt: "What will you do tomorrow?" },
    ],
  },
  {
    id: "my-day",
    type: "SPEAKING",
    category: "Speaking",
    title: "My Day",
    subtitle: "Ordinary moments become speaking practice.",
    description: "Describe your routine using complete ideas.",
    narrative: "Your everyday world is full of words you can claim.",
    objective: "Describe your routine for 2 minutes.",
    difficulty: "EASY",
    xpReward: QUEST_REWARDS.EASY,
    estimatedMinutes: 2,
    minimumActiveSeconds: 120,
    steps: [
      {
        id: "start",
        kind: "PROMPT",
        prompt: "What do you usually do in the morning?",
      },
      {
        id: "afternoon",
        kind: "PROMPT",
        prompt: "What happens in your afternoon?",
      },
      { id: "evening", kind: "PROMPT", prompt: "How do you end your day?" },
    ],
  },
  {
    id: "train-your-ears",
    type: "LISTENING",
    category: "Listening",
    title: "Train Your Ears",
    subtitle: "Listen for the idea, not every word.",
    description: "Listen to Daniel and answer two questions.",
    narrative: "A clear signal is waiting inside the noise.",
    objective: "Play the message and understand its main details.",
    difficulty: "NORMAL",
    xpReward: QUEST_REWARDS.NORMAL,
    estimatedMinutes: 2,
    minimumActiveSeconds: 0,
    audioAssetId: "daniel-intro",
    steps: [
      {
        id: "job",
        kind: "MULTIPLE_CHOICE",
        prompt: "What does Daniel do?",
        options: [
          { id: "teacher", label: "Teacher" },
          { id: "developer", label: "Software developer" },
          { id: "designer", label: "Designer" },
        ],
        correctOptionId: "developer",
        explanation: "Daniel says that he is a software developer.",
      },
      {
        id: "place",
        kind: "MULTIPLE_CHOICE",
        prompt: "Where does Daniel work?",
        options: [
          { id: "office", label: "In an office" },
          { id: "home", label: "From home" },
          { id: "school", label: "At a school" },
        ],
        correctOptionId: "home",
        explanation: "He says that he works from home.",
      },
    ],
  },
  {
    id: "the-voice-message",
    type: "LISTENING",
    category: "Listening",
    title: "The Voice Message",
    subtitle: "A message can change the route.",
    description: "Listen to a short work message and recover its details.",
    narrative: "The next clue arrives through a distant voice.",
    objective: "Play the message and answer both questions.",
    difficulty: "NORMAL",
    xpReward: QUEST_REWARDS.NORMAL,
    estimatedMinutes: 2,
    minimumActiveSeconds: 0,
    audioAssetId: "meeting-message",
    steps: [
      {
        id: "time",
        kind: "MULTIPLE_CHOICE",
        prompt: "What time is the meeting?",
        options: [
          { id: "two", label: "2 PM" },
          { id: "three", label: "3 PM" },
          { id: "four", label: "4 PM" },
        ],
        correctOptionId: "three",
        explanation: "The meeting was moved to 3 PM.",
      },
      {
        id: "document",
        kind: "TRUE_FALSE",
        prompt: "The API documentation should be sent before lunch.",
        options: [
          { id: "true", label: "True" },
          { id: "false", label: "False" },
        ],
        correctOptionId: "true",
        explanation: "The speaker asks for it before lunch.",
      },
    ],
  },
  {
    id: "the-message",
    type: "READING",
    category: "Reading",
    title: "The Message",
    subtitle: "Read what changed before you act.",
    description: "Read a short workplace message and find its key details.",
    narrative: "A message arrives with new coordinates.",
    objective: "Read the message and answer three questions.",
    difficulty: "NORMAL",
    xpReward: QUEST_REWARDS.NORMAL,
    estimatedMinutes: 3,
    minimumActiveSeconds: 0,
    passage:
      "Hey Alex, the meeting was moved to 3 PM. Please send me the API documentation before lunch.",
    steps: [
      {
        id: "meeting",
        kind: "MULTIPLE_CHOICE",
        prompt: "What time is the meeting?",
        options: [
          { id: "noon", label: "12 PM" },
          { id: "three", label: "3 PM" },
          { id: "five", label: "5 PM" },
        ],
        correctOptionId: "three",
        explanation: "The meeting was moved to 3 PM.",
      },
      {
        id: "send",
        kind: "MULTIPLE_CHOICE",
        prompt: "What should Alex send?",
        options: [
          { id: "api", label: "The API documentation" },
          { id: "report", label: "A financial report" },
          { id: "invite", label: "A meeting invitation" },
        ],
        correctOptionId: "api",
        explanation: "The message asks for the API documentation.",
      },
      {
        id: "deadline",
        kind: "TRUE_FALSE",
        prompt: "Alex should send the document after lunch.",
        options: [
          { id: "true", label: "True" },
          { id: "false", label: "False" },
        ],
        correctOptionId: "false",
        explanation: "It should be sent before lunch.",
      },
    ],
  },
  {
    id: "read-the-clue",
    type: "READING",
    category: "Reading",
    title: "Read the Clue",
    subtitle: "The smallest detail can reveal the path.",
    description: "Read a travel note and identify the plan.",
    narrative: "A handwritten clue points toward the next checkpoint.",
    objective: "Read the clue and answer two questions.",
    difficulty: "EASY",
    xpReward: QUEST_REWARDS.EASY,
    estimatedMinutes: 2,
    minimumActiveSeconds: 0,
    passage:
      "Take the blue bus to Central Station. Meet Emma beside the coffee shop at half past nine.",
    steps: [
      {
        id: "transport",
        kind: "MULTIPLE_CHOICE",
        prompt: "How should you travel?",
        options: [
          { id: "bus", label: "By blue bus" },
          { id: "train", label: "By train" },
          { id: "walk", label: "On foot" },
        ],
        correctOptionId: "bus",
        explanation: "The clue says to take the blue bus.",
      },
      {
        id: "time",
        kind: "MULTIPLE_CHOICE",
        prompt: "When should you meet Emma?",
        options: [
          { id: "nine", label: "9:00" },
          { id: "nine-thirty", label: "9:30" },
          { id: "ten", label: "10:00" },
        ],
        correctOptionId: "nine-thirty",
        explanation: "Half past nine means 9:30.",
      },
    ],
  },
  {
    id: "memory-battle",
    type: "VOCABULARY",
    category: "Vocabulary",
    title: "Memory Battle",
    subtitle: "Choose the word that completes the thought.",
    description: "Use context to recover the missing word.",
    narrative: "A sentence blocks the gate. One word will open it.",
    objective: "Complete two vocabulary challenges.",
    difficulty: "NORMAL",
    xpReward: QUEST_REWARDS.NORMAL,
    estimatedMinutes: 2,
    minimumActiveSeconds: 0,
    steps: [
      {
        id: "although",
        kind: "FILL_GAP",
        prompt: "_____ the task was difficult, I finished it.",
        options: [
          { id: "although", label: "Although" },
          { id: "during", label: "During" },
          { id: "because", label: "Because" },
        ],
        correctOptionId: "although",
        explanation:
          "Although introduces a contrast between the difficult task and finishing it.",
      },
      {
        id: "reliable",
        kind: "MULTIPLE_CHOICE",
        prompt: "Which word means someone you can trust?",
        options: [
          { id: "reliable", label: "Reliable" },
          { id: "available", label: "Available" },
          { id: "careful", label: "Careful" },
        ],
        correctOptionId: "reliable",
        explanation: "Reliable describes a person or thing you can trust.",
      },
    ],
  },
  {
    id: "choose-your-word",
    type: "VOCABULARY",
    category: "Vocabulary",
    title: "Choose Your Word",
    subtitle: "Precision turns an idea into a message.",
    description: "Choose the best word for each context.",
    narrative: "Three words appear. Only one fits the path ahead.",
    objective: "Choose the best word in two situations.",
    difficulty: "EASY",
    xpReward: QUEST_REWARDS.EASY,
    estimatedMinutes: 2,
    minimumActiveSeconds: 0,
    steps: [
      {
        id: "deadline",
        kind: "FILL_GAP",
        prompt: "We need to _____ the deadline.",
        options: [
          { id: "meet", label: "meet" },
          { id: "take", label: "take" },
          { id: "make", label: "make" },
        ],
        correctOptionId: "meet",
        explanation: "In English, we meet a deadline.",
      },
      {
        id: "issue",
        kind: "MULTIPLE_CHOICE",
        prompt: "Which word is closest to ‘problem’ in a work context?",
        options: [
          { id: "issue", label: "Issue" },
          { id: "feature", label: "Feature" },
          { id: "schedule", label: "Schedule" },
        ],
        correctOptionId: "issue",
        explanation:
          "Issue is commonly used for a problem that needs attention.",
      },
    ],
  },
  {
    id: "use-your-weapon",
    type: "VOCABULARY",
    category: "Vocabulary",
    title: "Use Your Weapon",
    subtitle: "A word becomes yours when you use it.",
    description: "Recognize a word, then write your own sentence.",
    narrative: "Knowledge becomes power when it leaves the inventory.",
    objective: "Choose the meaning and practice using the word.",
    difficulty: "NORMAL",
    xpReward: QUEST_REWARDS.NORMAL,
    estimatedMinutes: 3,
    minimumActiveSeconds: 0,
    steps: [
      {
        id: "improve",
        kind: "MULTIPLE_CHOICE",
        prompt: "What does ‘improve’ mean?",
        options: [
          { id: "better", label: "To make something better" },
          { id: "finish", label: "To stop something" },
          { id: "repeat", label: "To say something again" },
        ],
        correctOptionId: "better",
        explanation: "To improve is to make or become better.",
      },
      {
        id: "use-improve",
        kind: "MANUAL_PRACTICE",
        prompt: "Create your own sentence using ‘improve’.",
        example: "I want to improve my English speaking skills.",
      },
    ],
  },
  {
    id: "knowledge-scroll",
    type: "EXTERNAL",
    category: "Vocabulary",
    title: "Knowledge Scroll",
    subtitle: "Continue your lesson beyond this app.",
    description: "Complete one English lesson in Busuu or your chosen course.",
    narrative: "Some knowledge is found in scrolls beyond this map.",
    objective: "Complete one external English lesson, then confirm it here.",
    difficulty: "EASY",
    xpReward: QUEST_REWARDS.EASY,
    estimatedMinutes: 0,
    minimumActiveSeconds: 0,
    externalProvider: "External lesson",
    steps: [],
  },
  {
    id: "grammar-dungeon",
    type: "EXTERNAL",
    category: "Grammar",
    title: "Grammar Dungeon",
    subtitle: "Practice a structure outside the app.",
    description: "Practice grammar for 10 minutes with your chosen material.",
    narrative: "The dungeon opens when a difficult pattern becomes familiar.",
    objective:
      "Practice grammar externally for 10 minutes, then confirm it here.",
    difficulty: "NORMAL",
    xpReward: QUEST_REWARDS.NORMAL,
    estimatedMinutes: 10,
    minimumActiveSeconds: 0,
    externalProvider: "Your chosen study resource",
    steps: [],
  },
] as const satisfies readonly MissionDefinition[];

export interface ScheduledMission {
  missionId: string;
  templateId: string;
}

export const WORLD_ONE_MISSION_DAYS: readonly (readonly ScheduledMission[])[] =
  [
    [
      { missionId: "train-your-ears", templateId: "train-your-ears" },
      { missionId: "break-the-silence", templateId: "speak-up" },
      { missionId: "knowledge-scroll", templateId: "knowledge-scroll" },
    ],
    [
      { missionId: "grammar-dungeon", templateId: "grammar-dungeon" },
      { missionId: "tell-your-story", templateId: "tell-your-story" },
      { missionId: "the-voice-message", templateId: "quick-listen" },
    ],
    [
      { missionId: "memory-battle", templateId: "memory-battle" },
      { missionId: "the-message", templateId: "the-message" },
      { missionId: "my-day", templateId: "my-day" },
    ],
    [
      { missionId: "read-the-clue", templateId: "read-the-clue" },
      { missionId: "choose-your-word", templateId: "choose-your-word" },
      { missionId: "use-your-weapon", templateId: "use-your-weapon" },
    ],
    [
      { missionId: "break-the-silence", templateId: "break-the-silence" },
      { missionId: "the-voice-message", templateId: "the-voice-message" },
      { missionId: "knowledge-scroll", templateId: "knowledge-scroll" },
    ],
  ];

export function missionDefinition(id: string) {
  return MISSION_DEFINITIONS.find((mission) => mission.id === id) ?? null;
}

export function missionsForStudyDay(
  studyDay: number,
  preferredVocabularyMissionIds: readonly string[] = [],
) {
  const index = (studyDay - 1) % WORLD_ONE_MISSION_DAYS.length;
  const scheduled = WORLD_ONE_MISSION_DAYS[index] ?? [];
  if (preferredVocabularyMissionIds.length === 0) return scheduled;
  const used = new Set(scheduled.map((mission) => mission.missionId));
  let preferenceIndex = 0;
  return scheduled.map((mission) => {
    const definition = missionDefinition(mission.missionId);
    if (definition?.type !== "VOCABULARY") return mission;
    let preferred: string | undefined;
    while (
      !preferred &&
      preferenceIndex < preferredVocabularyMissionIds.length
    ) {
      const candidate = preferredVocabularyMissionIds[preferenceIndex++];
      if (candidate === mission.missionId) return mission;
      if (
        !used.has(candidate) &&
        missionDefinition(candidate)?.type === "VOCABULARY"
      )
        preferred = candidate;
    }
    if (!preferred) return mission;
    used.delete(mission.missionId);
    used.add(preferred);
    return { missionId: preferred, templateId: preferred };
  });
}
