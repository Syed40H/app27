/**
 * Sessions are keyed to **local midnight**. The day key is computed from the
 * device's current timezone, never UTC — a 9pm workout must not land on
 * tomorrow's card because the user is east of Greenwich.
 */

/** `YYYY-MM-DD` in the device's timezone. */
export function dayKeyOf(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse a day key back into a local-midnight Date. */
export function dateFromDayKey(dayKey: string): Date {
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** "Today", "Yesterday", "Mon 3 Feb", or "Mon 3 Feb 2024" once the year differs. */
export function formatDayKey(dayKey: string, today: Date = new Date()): string {
  const todayKey = dayKeyOf(today);
  if (dayKey === todayKey) return 'Today';

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dayKey === dayKeyOf(yesterday)) return 'Yesterday';

  const date = dateFromDayKey(dayKey);
  const base = `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
  return date.getFullYear() === today.getFullYear()
    ? base
    : `${base} ${date.getFullYear()}`;
}

/**
 * "Mon 3 Feb", always — never "Today". Used as the date line under a workout's
 * name, where the actual calendar date is the useful thing.
 */
export function formatFullDate(dayKey: string, today: Date = new Date()): string {
  const date = dateFromDayKey(dayKey);
  const base = `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
  return date.getFullYear() === today.getFullYear()
    ? base
    : `${base} ${date.getFullYear()}`;
}

/** "February 2024" — the History screen groups by month. */
export function formatMonthKey(dayKey: string): string {
  const date = dateFromDayKey(dayKey);
  const full = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${full[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Whether a day key falls within the last `days` days, counting today as 0.
 *
 * Used to mark a personal best as freshly set — a record from this week should
 * feel different from one that has stood for two years.
 */
export function isWithinDays(dayKey: string, days: number, today: Date = new Date()): boolean {
  const cutoff = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  cutoff.setDate(cutoff.getDate() - days);
  return dayKey >= dayKeyOf(cutoff) && dayKey <= dayKeyOf(today);
}

/** `YYYY-MM`, used to bucket the History list. */
export function monthKeyOf(dayKey: string): string {
  return dayKey.slice(0, 7);
}
