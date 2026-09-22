import {
  addCalendarDays,
  calendarOrdinal,
  inactivityDays,
  weekStart,
} from "./calendar";
import { CAMPAIGN } from "./config";
import type { Clock, JourneyState } from "./types";
export function refreshWeeklyTokens(
  tokens: number,
  previousWeek: string,
  today: string,
) {
  const currentWeek = weekStart(today);
  const weeks = Math.max(
    0,
    (calendarOrdinal(currentWeek) - calendarOrdinal(previousWeek)) / 7,
  );
  return {
    tokens: Math.min(
      CAMPAIGN.restTokens.maximum,
      tokens + weeks * CAMPAIGN.restTokens.weekly,
    ),
    week: currentWeek < previousWeek ? previousWeek : currentWeek,
  };
}
export function protectRestDay(streak: number, tokens: number) {
  if (streak === 0) return { streak, tokens };
  return tokens > 0 ? { streak, tokens: tokens - 1 } : { streak: 0, tokens };
}
export function comebackStatus(days: number): JourneyState["comeback"] {
  return days >= CAMPAIGN.comebackAfter
    ? "COMEBACK_MODE"
    : days >= CAMPAIGN.welcomeBackAfter
      ? "WELCOME_BACK"
      : "NORMAL";
}
// Settle closed local-calendar days exactly once; weekly grants happen before
// consuming that day's token, so opening frequency cannot change the outcome.
export function reconcileConsistency(
  state: JourneyState,
  now: Clock,
): JourneyState {
  if (!state.startedAt || !state.startedDay || !state.tokenWeek) return state;
  if (state.lastObservedDay && now.day < state.lastObservedDay) return state;
  let tokens = state.restTokens;
  let streak = state.streak;
  let tokenWeek = state.tokenWeek;
  const yesterday = addCalendarDays(now.day, -1);
  let through =
    state.consistencyThrough ?? addCalendarDays(state.startedDay, -1);
  for (
    let day = addCalendarDays(through, 1);
    day <= yesterday;
    day = addCalendarDays(day, 1)
  ) {
    const refreshed = refreshWeeklyTokens(tokens, tokenWeek, day);
    tokens = refreshed.tokens;
    tokenWeek = refreshed.week;
    if (!state.completedDays.some((record) => record.calendarDay === day)) {
      const protectedDay = protectRestDay(streak, tokens);
      streak = protectedDay.streak;
      tokens = protectedDay.tokens;
    }
    through = day;
  }
  const refreshed = refreshWeeklyTokens(tokens, tokenWeek, now.day);
  const comeback = comebackStatus(
    inactivityDays(state.lastActivityDay ?? state.startedDay, now.day),
  );
  if (
    state.restTokens === refreshed.tokens &&
    state.streak === streak &&
    state.tokenWeek === refreshed.week &&
    state.consistencyThrough === through &&
    state.comeback === comeback &&
    state.lastObservedDay === now.day
  )
    return state;
  return {
    ...state,
    restTokens: refreshed.tokens,
    tokenWeek: refreshed.week,
    streak,
    consistencyThrough: through,
    comeback,
    lastObservedDay: now.day,
  };
}
