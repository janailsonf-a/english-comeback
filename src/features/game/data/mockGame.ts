import type { GameSnapshot } from "../types";

export const mockGame: GameSnapshot = {
  player: {
    id: "player-janailson",
    name: "Janailson",
    title: "The returning adventurer",
    level: 3,
    xp: 420,
    streak: 4,
  },
  world: {
    id: "the-comeback",
    number: 1,
    name: "THE COMEBACK",
    tagline: "Small steps. A new beginning.",
    day: 4,
    journeyDays: 90,
  },
  boss: {
    id: "the-silence",
    name: "THE SILENCE",
    description:
      "Find your voice. Speak English for a few minutes without holding back.",
    unlockLevel: 4,
    difficulty: "First encounter",
  },
  quests: [
    {
      id: "train-your-ears",
      title: "Train Your Ears",
      category: "Listening",
      duration: "10 min",
      description: "Tune in to English, one small moment at a time.",
      objective:
        "Listen to a short English video or podcast for 10 minutes. Try to catch the main idea and three words you recognize.",
      xpReward: 15,
      status: "available",
      optional: false,
    },
    {
      id: "speak-up",
      title: "Speak Up",
      category: "Speaking",
      duration: "10 min",
      description: "Your voice is part of the adventure.",
      objective:
        "Talk out loud about your day for 10 minutes. Pause, repeat, and try again whenever you need to.",
      xpReward: 20,
      status: "available",
      optional: false,
    },
    {
      id: "knowledge-scroll",
      title: "Knowledge Scroll",
      category: "Study",
      duration: "1 lesson",
      description: "A little knowledge goes a long way.",
      objective:
        "Complete one lesson in your favorite English course or book. Write down one thing you want to remember.",
      xpReward: 15,
      status: "available",
      optional: false,
    },
    {
      id: "grammar-dungeon",
      title: "Grammar Dungeon",
      category: "Grammar",
      duration: "10 min",
      description: "An optional detour to strengthen your foundation.",
      objective:
        "Review one grammar topic for 10 minutes and write three example sentences of your own.",
      xpReward: 15,
      status: "available",
      optional: true,
    },
    {
      id: "word-forge",
      title: "Word Forge",
      category: "Vocabulary",
      duration: "10 min",
      description: "Forge a few new words into your everyday English.",
      objective:
        "Review five useful English words for 10 minutes. Say each one out loud and use it in a sentence.",
      xpReward: 20,
      status: "available",
      optional: true,
    },
  ],
};
