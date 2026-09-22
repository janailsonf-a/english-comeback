import type { Clock } from "./types";
const DAY_MS = 86_400_000;
export function calendarOrdinal(day: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day))
    throw new RangeError("Invalid calendar day.");
  const value = Date.parse(`${day}T00:00:00Z`);
  if (
    !Number.isFinite(value) ||
    new Date(value).toISOString().slice(0, 10) !== day
  )
    throw new RangeError("Invalid calendar day.");
  return value / DAY_MS;
}
export function addCalendarDays(day: string, days: number): string {
  return new Date((calendarOrdinal(day) + days) * DAY_MS)
    .toISOString()
    .slice(0, 10);
}
export function sameCalendarDay(a: string, b: string) {
  return calendarOrdinal(a) === calendarOrdinal(b);
}
export function inactivityDays(previous: string, current: string) {
  return Math.max(0, calendarOrdinal(current) - calendarOrdinal(previous));
}
export function consecutiveCalendarDay(previous: string, current: string) {
  return calendarOrdinal(current) - calendarOrdinal(previous) === 1;
}
export function streakEligible(lastStudyDay: string | null, today: string) {
  return (
    lastStudyDay === null ||
    calendarOrdinal(today) > calendarOrdinal(lastStudyDay)
  );
}
export function weekStart(day: string) {
  const weekday = (calendarOrdinal(day) + 3) % 7;
  return addCalendarDays(day, -((weekday + 7) % 7));
}
export function clockFromDate(date: Date): Clock {
  const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  calendarOrdinal(day);
  return { instant: date.toISOString(), day };
}
