import type { ActivityCategory, Difficulty } from "./types";
export const CAMPAIGN = {
  studyDays: 90,
  dailyQuestCount: 3,
  dailyBonus: 20,
  restTokens: { initial: 2, weekly: 2, maximum: 4 },
  welcomeBackAfter: 2,
  comebackAfter: 3,
  returnQuestAfter: 7,
  assessmentDays: [1, 14, 30, 50, 70, 90],
} as const;
export const QUEST_REWARDS: Record<Difficulty, number> = {
  EASY: 10,
  NORMAL: 20,
  HARD: 30,
};
export const WORLDS = [
  {
    id: "the-comeback",
    number: 1,
    name: "THE COMEBACK",
    subtitle: "Small steps. A new beginning.",
    start: 1,
    end: 14,
    playable: true,
    milestones: [1, 3, 7, 10, 14],
  },
  {
    id: "find-your-voice",
    number: 2,
    name: "FIND YOUR VOICE",
    subtitle: "Make room for your voice.",
    start: 15,
    end: 30,
    playable: false,
    milestones: [15, 30],
  },
  {
    id: "into-the-wild",
    number: 3,
    name: "INTO THE WILD",
    subtitle: "Meet English in the real world.",
    start: 31,
    end: 50,
    playable: false,
    milestones: [31, 50],
  },
  {
    id: "developer-mode",
    number: 4,
    name: "DEVELOPER MODE",
    subtitle: "Bring your ideas to the world.",
    start: 51,
    end: 70,
    playable: false,
    milestones: [51, 70],
  },
  {
    id: "go-international",
    number: 5,
    name: "GO INTERNATIONAL",
    subtitle: "Your next horizon awaits.",
    start: 71,
    end: 90,
    playable: false,
    milestones: [71, 90],
  },
] as const;
export const SILENCE = {
  id: "the-silence",
  name: "THE SILENCE",
  hp: 100,
  xpReward: 150,
  unlockStudyDays: WORLDS[0].end,
  objective: "Speak English for 5 minutes.",
  steps: [
    {
      id: "introduce",
      title: "INTRODUCE YOURSELF",
      damage: 20,
      durationMinutes: 1,
    },
    { id: "day", title: "TALK ABOUT YOUR DAY", damage: 20, durationMinutes: 1 },
    {
      id: "hobbies",
      title: "TALK ABOUT YOUR HOBBIES",
      damage: 20,
      durationMinutes: 1,
    },
    {
      id: "work",
      title: "TALK ABOUT YOUR WORK OR STUDIES",
      damage: 20,
      durationMinutes: 1,
    },
    { id: "final", title: "FINAL TALK", damage: 20, durationMinutes: 1 },
  ],
} as const;
interface QuestTemplate {
  id: string;
  title: string;
  category: ActivityCategory;
  description: string;
  difficulty: Difficulty;
  duration: string;
  minutes: number | null;
}
export const QUEST_POOL: readonly QuestTemplate[] = [
  {
    id: "train-your-ears",
    title: "Train Your Ears",
    category: "Listening",
    description: "Watch or listen to English content for 10 minutes.",
    difficulty: "NORMAL",
    duration: "10 min",
    minutes: 10,
  },
  {
    id: "speak-up",
    title: "Speak Up",
    category: "Speaking",
    description: "Speak English for 5 minutes.",
    difficulty: "NORMAL",
    duration: "5 min",
    minutes: 5,
  },
  {
    id: "knowledge-scroll",
    title: "Knowledge Scroll",
    category: "Vocabulary",
    description:
      "Complete one English lesson. Time is not estimated for this quest.",
    difficulty: "EASY",
    duration: "1 lesson",
    minutes: null,
  },
  {
    id: "grammar-dungeon",
    title: "Grammar Dungeon",
    category: "Grammar",
    description: "Practice grammar for 10 minutes.",
    difficulty: "NORMAL",
    duration: "10 min",
    minutes: 10,
  },
  {
    id: "tell-your-story",
    title: "Tell Your Story",
    category: "Speaking",
    description: "Talk about your day in English for 3 minutes.",
    difficulty: "NORMAL",
    duration: "3 min",
    minutes: 3,
  },
  {
    id: "quick-listen",
    title: "Quick Listen",
    category: "Listening",
    description: "Listen to English for 5 minutes.",
    difficulty: "EASY",
    duration: "5 min",
    minutes: 5,
  },
];
export const ACHIEVEMENTS = [
  {
    id: "first-step",
    title: "FIRST STEP",
    description: "Complete your first quest.",
  },
  { id: "on-fire", title: "ON FIRE", description: "Complete 7 Study Days." },
  {
    id: "speak-up",
    title: "SPEAK UP",
    description: "Accumulate 30 minutes of Speaking.",
  },
  {
    id: "all-ears",
    title: "ALL EARS",
    description: "Accumulate 60 minutes of Listening.",
  },
  {
    id: "boss-slayer",
    title: "BOSS SLAYER",
    description: "Defeat your first Boss.",
  },
  {
    id: "i-found-my-voice",
    title: "I FOUND MY VOICE",
    description: "Defeat THE SILENCE.",
  },
  { id: "scholar", title: "SCHOLAR", description: "Complete 50 quests." },
] as const;
