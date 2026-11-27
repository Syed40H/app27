import { dayKeyOf } from './dayKey';

/**
 * Consistency, measured honestly.
 *
 * A *daily* streak is the wrong shape for lifting — rest days are part of the
 * programme, so a day-counter would punish training correctly. This counts
 * **consecutive weeks with at least one workout**, which is how people actually
 * talk about staying consistent, and it survives a deload week's rest days.
 *
 * Weeks run Monday to Sunday.
 */

export interface WeekDay {
  dayKey: string;
  /** Single letter for the strip: M, T, W... */
  letter: string;
  trained: boolean;
  isToday: boolean;
  /** Days after today in the current week, which are not misses yet. */
  isFuture: boolean;
}

const LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** The Monday on or before `date`, at local midnight. */
export function startOfWeek(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // getDay() is 0 for Sunday, so Sunday belongs to the week that began 6 days ago.
  const offset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - offset);
  return start;
}

/** The seven days of the week containing `today`, in order. */
export function weekDays(trained: Set<string>, today: Date = new Date()): WeekDay[] {
  const monday = startOfWeek(today);
  const todayKey = dayKeyOf(today);

  return LETTERS.map((letter, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const dayKey = dayKeyOf(date);
    return {
      dayKey,
      letter,
      trained: trained.has(dayKey),
      isToday: dayKey === todayKey,
      isFuture: dayKey > todayKey,
    };
  });
}

/**
 * How many consecutive weeks have at least one workout.
 *
 * The current week only counts once it has a workout in it — but an empty
 * current week does **not** reset the streak, it just is not counted yet.
 * Otherwise every Monday morning would wipe a streak someone had earned, which
 * is exactly the moment they most need it intact.
 */
export function weeklyStreak(trained: Set<string>, today: Date = new Date()): number {
  if (trained.size === 0) return 0;

  const weekHasWorkout = (weekStart: Date): boolean => {
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      if (trained.has(dayKeyOf(day))) return true;
    }
    return false;
  };

  const cursor = startOfWeek(today);
  let streak = 0;

  // If this week is still empty, start counting from last week instead of
  // treating the streak as broken.
  if (!weekHasWorkout(cursor)) cursor.setDate(cursor.getDate() - 7);

  // A hard bound so a corrupt date can never spin here forever.
  for (let guard = 0; guard < 520; guard++) {
    if (!weekHasWorkout(cursor)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 7);
  }

  return streak;
}

/** How many workouts fall in the week containing `today`. */
export function workoutsThisWeek(dayKeys: string[], today: Date = new Date()): number {
  const monday = startOfWeek(today);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const from = dayKeyOf(monday);
  const to = dayKeyOf(sunday);
  return dayKeys.filter((key) => key >= from && key <= to).length;
}
