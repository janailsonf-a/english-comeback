import { needsPrologue, unlockTitles } from "./narrative/rules";
import { inactivityDays, streakEligible } from "./calendar";
import { CAMPAIGN, QUEST_REWARDS, SILENCE } from "./config";
import { reconcileConsistency } from "./consistency";
import { dailyQuests } from "./selectors";
import { emptyJourney, startJourney, questsForDay } from "./stateFactory";
import { unlockAchievements, grantXp } from "./rewards";
import type { Clock, JourneyState } from "./types";
export { emptyJourney, questsForDay } from "./stateFactory";

export interface JourneyFeedback {
  questId: string;
  xpAwarded: number;
  levelsGained: number;
  level: number;
  dayComplete?: number;
  bossDefeated?: boolean;
  achievementIds?: string[];
  titleIds?: string[];
  questTitle?: string;
  category?: string;
  dailyCompleted?: number;
  dailyTotal?: number;
  chapterDay?: number;
}
export interface JourneyResult {
  journey: JourneyState;
  feedback: JourneyFeedback | null;
}
export type JourneyAction =
  | { type: "start" }
  | { type: "reset"; confirmed: boolean }
  | { type: "refresh" }
  | { type: "activate"; questId: string }
  | { type: "complete"; questId: string }
  | { type: "bossStep"; stepId: string };

export function refreshJourney(state: JourneyState, now: Clock): JourneyState {
  let next = reconcileConsistency(state, now);
  if (
    !next.startedAt ||
    !next.startedDay ||
    now.day < (next.lastObservedDay ?? now.day)
  )
    return next;
  const inactive = inactivityDays(
    next.lastActivityDay ?? next.startedDay,
    now.day,
  );
  const id = `return:${next.lastActivityDay ?? next.startedDay}`;
  if (
    inactive >= CAMPAIGN.returnQuestAfter &&
    !next.quests.some((q) => q.id === id) &&
    !next.quests.some((q) => q.kind === "return" && q.status !== "completed")
  ) {
    next = {
      ...next,
      quests: [
        ...next.quests,
        {
          id,
          templateId: "just-come-back",
          title: "Just Come Back",
          description:
            "Study English for only 5 minutes. Your progress is still here.",
          category: "Listening",
          difficulty: "NORMAL",
          duration: "5 min",
          durationMinutes: 5,
          objective: "Listen to English for 5 minutes. Let's start small.",
          xpReward: QUEST_REWARDS.NORMAL,
          status: "available",
          studyDay: next.studyDays,
          completedAt: null,
          kind: "return",
        },
      ],
    };
  }
  return next;
}
export function applyJourneyAction(
  state: JourneyState,
  action: JourneyAction,
  now: Clock,
): JourneyResult {
  if (action.type === "reset")
    return {
      journey: action.confirmed ? emptyJourney() : state,
      feedback: null,
    };
  if (action.type === "start")
    return {
      journey: state.startedAt ? state : startJourney(now),
      feedback: null,
    };
  if (!state.startedAt || now.day < (state.lastObservedDay ?? now.day))
    return { journey: state, feedback: null };
  let next = refreshJourney(state, now);
  if ((action.type === "activate" || action.type === "complete" || action.type === "bossStep") && needsPrologue(next)) return { journey: next, feedback: null };
  if (action.type === "refresh") return { journey: next, feedback: null };
  if (action.type === "activate") {
    const quest = next.quests.find((q) => q.id === action.questId);
    if (!quest || quest.status !== "available")
      return { journey: next, feedback: null };
    return {
      journey: {
        ...next,
        quests: next.quests.map((q) =>
          q.id === quest.id ? { ...q, status: "active" } : q,
        ),
      },
      feedback: null,
    };
  }
  let feedbackId: string;
  let dayComplete: number | undefined;
  let bossDefeated = false;
  if (action.type === "complete") {
    const quest = next.quests.find((q) => q.id === action.questId);
    if (
      !quest ||
      !["available", "active"].includes(quest.status) ||
      (quest.kind === "daily" && quest.studyDay !== next.studyDays + 1)
    )
      return { journey: next, feedback: null };
    feedbackId = quest.id;
    next = {
      ...next,
      quests: next.quests.map((q) =>
        q.id === quest.id
          ? { ...q, status: "completed", completedAt: now.instant }
          : q,
      ),
    };
    if (
      quest.durationMinutes !== null &&
      !next.sessions.some((s) => s.id === `quest:${quest.id}`)
    )
      next = {
        ...next,
        sessions: [
          ...next.sessions,
          {
            id: `quest:${quest.id}`,
            category: quest.category,
            durationMinutes: quest.durationMinutes,
            source: quest.kind === "return" ? "return" : "quest",
            questId: quest.id,
            completedAt: now.instant,
            calendarDay: now.day,
          },
        ],
      };
    next = grantXp(next, quest.xpReward, `quest:${quest.id}`, "quest", now);
    const daily = dailyQuests(next);
    if (
      quest.kind === "daily" &&
      daily.length === CAMPAIGN.dailyQuestCount &&
      daily.every((q) => q.status === "completed") &&
      !next.completedDays.some((d) => d.studyDay === quest.studyDay)
    ) {
      dayComplete = quest.studyDay;
      next = grantXp(
        next,
        CAMPAIGN.dailyBonus,
        `day:${dayComplete}`,
        "day",
        now,
      );
      next = {
        ...next,
        studyDays: dayComplete,
        completedDays: [
          ...next.completedDays,
          {
            studyDay: dayComplete,
            completedAt: now.instant,
            calendarDay: now.day,
          },
        ],
        streak: streakEligible(next.lastStudyDay, now.day)
          ? next.streak + 1
          : next.streak,
        lastStudyDay: now.day,
        consistencyThrough: now.day,
        quests: [...next.quests, ...questsForDay(dayComplete + 1)],
      };
    }
  } else {
    const step = SILENCE.steps.find((s) => s.id === action.stepId);
    const nextStep = SILENCE.steps.find(
      (s) => !next.boss.completedSteps.includes(s.id),
    );
    if (
      !step ||
      step.id !== nextStep?.id ||
      next.studyDays < SILENCE.unlockStudyDays ||
      next.boss.defeatedAt
    )
      return { journey: next, feedback: null };
    feedbackId = `boss:${step.id}`;
    next = {
      ...next,
      boss: {
        ...next.boss,
        completedSteps: [...next.boss.completedSteps, step.id],
      },
      sessions: [
        ...next.sessions,
        {
          id: feedbackId,
          category: "Speaking",
          durationMinutes: step.durationMinutes,
          source: "boss",
          questId: null,
          completedAt: now.instant,
          calendarDay: now.day,
        },
      ],
    };
    if (next.boss.completedSteps.length === SILENCE.steps.length) {
      next = grantXp(next, SILENCE.xpReward, `boss:${SILENCE.id}`, "boss", now);
      next = { ...next, boss: { ...next.boss, defeatedAt: now.instant } };
      bossDefeated = true;
    }
  }
  next = unlockTitles(unlockAchievements(
    { ...next, lastActivityDay: now.day, comeback: "NORMAL" },
    now,
  ));
  const achievementIds = next.achievements
    .filter(
      (a) =>
        a.unlocked &&
        !state.achievements.find((old) => old.id === a.id)?.unlocked,
    )
    .map((a) => a.id);
  return {
    journey: next,
    feedback: {
      questId: feedbackId,
      xpAwarded: next.totalXpEarned - state.totalXpEarned,
      level: next.level,
      levelsGained: next.level - state.level,
      dayComplete,
      bossDefeated,
      achievementIds,
      titleIds: next.narrative?.titles.filter(t => !state.narrative?.titles.some(old => old.id === t.id)).map(t => t.id),
      questTitle: action.type === "complete" ? next.quests.find(q => q.id === action.questId)?.title : undefined,
      category: action.type === "complete" ? next.quests.find(q => q.id === action.questId)?.category : "Speaking",
      dailyCompleted: action.type === "complete" ? next.quests.filter(q => q.kind === "daily" && q.studyDay === next.quests.find(q => q.id === action.questId)?.studyDay && q.status === "completed").length : undefined,
      dailyTotal: CAMPAIGN.dailyQuestCount,
      chapterDay: action.type === "complete" ? next.quests.find(q => q.id === action.questId)?.studyDay : undefined,
    },
  };
}
