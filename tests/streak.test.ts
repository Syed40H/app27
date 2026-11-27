import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isWithinDays } from '../src/domain/dayKey';
import { startOfWeek, weekDays, weeklyStreak, workoutsThisWeek } from '../src/domain/streak';
import { workoutColor, WORKOUT_COLORS } from '../src/domain/workoutColor';

// Wednesday 9 September 2026.
const WEDNESDAY = new Date(2026, 8, 9, 12, 0, 0);

test('weeks start on Monday', () => {
  assert.equal(startOfWeek(WEDNESDAY).getDate(), 7);
  // Sunday belongs to the week that began six days earlier, not the next one.
  const sunday = new Date(2026, 8, 13, 12, 0, 0);
  assert.equal(startOfWeek(sunday).getDate(), 7);
  // Monday is its own week start.
  const monday = new Date(2026, 8, 7, 12, 0, 0);
  assert.equal(startOfWeek(monday).getDate(), 7);
});

test('the week strip marks trained days, today, and days not yet reached', () => {
  const days = weekDays(new Set(['2026-09-07', '2026-09-09']), WEDNESDAY);
  assert.equal(days.length, 7);
  assert.deepEqual(days.map((d) => d.letter), ['M', 'T', 'W', 'T', 'F', 'S', 'S']);

  assert.equal(days[0]?.trained, true, 'Monday was trained');
  assert.equal(days[1]?.trained, false, 'Tuesday was not');
  assert.equal(days[2]?.trained, true, 'Wednesday was trained');

  assert.equal(days[2]?.isToday, true);
  assert.equal(days[2]?.isFuture, false);
  // Thursday onward has not happened yet, so it is not a missed day.
  assert.equal(days[3]?.isFuture, true);
  assert.equal(days[0]?.isFuture, false);
});

test('no workouts means no streak', () => {
  assert.equal(weeklyStreak(new Set(), WEDNESDAY), 0);
});

test('a workout this week starts a streak of one', () => {
  assert.equal(weeklyStreak(new Set(['2026-09-09']), WEDNESDAY), 1);
});

test('consecutive weeks accumulate', () => {
  const trained = new Set([
    '2026-09-09', // this week
    '2026-09-02', // last week
    '2026-08-26', // the week before
  ]);
  assert.equal(weeklyStreak(trained, WEDNESDAY), 3);
});

test('a missed week breaks the streak', () => {
  const trained = new Set([
    '2026-09-09', // this week
    '2026-09-02', // last week
    // week of 24 Aug missed
    '2026-08-19',
  ]);
  assert.equal(weeklyStreak(trained, WEDNESDAY), 2);
});

test('an empty current week does not wipe an earned streak', () => {
  // Monday morning, nothing logged yet this week.
  const monday = new Date(2026, 8, 7, 8, 0, 0);
  const trained = new Set(['2026-09-02', '2026-08-26']);
  assert.equal(
    weeklyStreak(trained, monday),
    2,
    'the streak should still stand until the week is actually missed',
  );
});

test('workouts this week counts only the current Monday-to-Sunday window', () => {
  const keys = ['2026-09-07', '2026-09-09', '2026-09-13', '2026-09-06', '2026-09-14'];
  // 6 Sep is the previous Sunday and 14 Sep the next Monday; neither counts.
  assert.equal(workoutsThisWeek(keys, WEDNESDAY), 3);
});

test('the three main splits get different colours', () => {
  const push = workoutColor('Push');
  const pull = workoutColor('Pull');
  const legs = workoutColor('Legs');
  assert.equal(new Set([push, pull, legs]).size, 3);
});

test('a workout colour is stable and case-insensitive', () => {
  assert.equal(workoutColor('Push'), workoutColor('  push  '));
  assert.equal(workoutColor('My Split'), workoutColor('my split'));
});

test('a custom label still gets a colour from the palette', () => {
  const custom = workoutColor('Grip And Rip');
  assert.ok(WORKOUT_COLORS.includes(custom as (typeof WORKOUT_COLORS)[number]));
});

test('an unlabelled workout borrows its first exercise muscle group', () => {
  assert.equal(workoutColor(null, 'Chest'), workoutColor(null, 'Chest'));
  assert.notEqual(workoutColor(null, 'Chest'), workoutColor(null, 'Legs'));
  // Still returns something usable with nothing to go on at all.
  assert.ok(WORKOUT_COLORS.includes(workoutColor(null) as (typeof WORKOUT_COLORS)[number]));
});

test('no workout colour is the reserved accent', () => {
  for (const value of WORKOUT_COLORS) {
    assert.notEqual(value.toLowerCase(), '#e8552d');
  }
});

test('a record set recently is marked fresh, an old one is not', () => {
  const today = new Date(2026, 8, 9);
  assert.equal(isWithinDays('2026-09-09', 14, today), true, 'today counts');
  assert.equal(isWithinDays('2026-08-27', 14, today), true, '13 days ago counts');
  assert.equal(isWithinDays('2026-08-25', 14, today), false, '15 days ago does not');
  // A date in the future is not "recent", it is wrong.
  assert.equal(isWithinDays('2026-09-10', 14, today), false);
});
