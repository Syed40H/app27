import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  describePosition,
  firstOccurrencePosition,
  ghostForSet,
  ordinal,
  positionBadge,
  type ExerciseHistory,
} from '../src/domain/recall';

function history(partial: Partial<ExerciseHistory> = {}): ExerciseHistory {
  return {
    sessionId: 's1',
    dayKey: '2026-09-01',
    position: 3,
    totalExercises: 5,
    sets: [
      { weightKg: 80, reps: 8 },
      { weightKg: 85, reps: 6 },
      { weightKg: 90, reps: 4 },
    ],
    ...partial,
  };
}

test('ghost: set N maps to last time set N', () => {
  const h = history();
  assert.deepEqual(ghostForSet(h, 0), { weightKg: 80, reps: 8 });
  assert.deepEqual(ghostForSet(h, 1), { weightKg: 85, reps: 6 });
  assert.deepEqual(ghostForSet(h, 2), { weightKg: 90, reps: 4 });
});

test('ghost: extra sets today all ghost last time\'s final set', () => {
  const h = history();
  assert.deepEqual(ghostForSet(h, 3), { weightKg: 90, reps: 4 });
  assert.deepEqual(ghostForSet(h, 9), { weightKg: 90, reps: 4 });
});

test('ghost: fewer sets today simply leaves the surplus unused', () => {
  const h = history({ sets: [{ weightKg: 60, reps: 10 }] });
  assert.deepEqual(ghostForSet(h, 0), { weightKg: 60, reps: 10 });
  // Nothing today maps to a set that does not exist today; asking for index 1
  // still clamps rather than throwing.
  assert.deepEqual(ghostForSet(h, 1), { weightKg: 60, reps: 10 });
});

test('ghost: an exercise with no history has no ghosts at all', () => {
  assert.equal(ghostForSet(null, 0), null);
  assert.equal(ghostForSet(history({ sets: [] }), 0), null);
});

test('ghost: a bodyweight set ghosts a null weight, not a zero', () => {
  const h = history({ sets: [{ weightKg: null, reps: 12 }] });
  assert.deepEqual(ghostForSet(h, 0), { weightKg: null, reps: 12 });
});

test('badge: hidden when the position matches last time', () => {
  assert.equal(positionBadge(history({ position: 1 }), 1), null);
  assert.equal(positionBadge(history({ position: 4 }), 4), null);
});

test('badge: shows last time\'s position when it differs', () => {
  assert.equal(positionBadge(history({ position: 3 }), 1), 3);
  assert.equal(positionBadge(history({ position: 1 }), 5), 1);
});

test('badge: hidden entirely for an exercise never done before', () => {
  assert.equal(positionBadge(null, 1), null);
});

test('badge tooltip explains how many exercises came before it', () => {
  const fresher = describePosition(history({ position: 4 }), 1);
  assert.match(fresher, /3 exercises before this one/);
  assert.match(fresher, /fresher/);

  const deeper = describePosition(history({ position: 1 }), 3);
  assert.match(deeper, /first exercise/);
  assert.match(deeper, /deeper into the session/);

  // Singular, not "1 exercises".
  assert.match(describePosition(history({ position: 2 }), 5), /1 exercise before/);
});

test('first occurrence wins when the same exercise appears twice', () => {
  const entries = [
    { exerciseId: 'bench' },
    { exerciseId: 'row' },
    { exerciseId: 'bench' },
  ];
  assert.equal(firstOccurrencePosition(entries, 'bench'), 1);
  assert.equal(firstOccurrencePosition(entries, 'row'), 2);
  assert.equal(firstOccurrencePosition(entries, 'squat'), null);
});

test('positions renumber themselves when an earlier exercise is deleted', () => {
  const before = [{ exerciseId: 'a' }, { exerciseId: 'b' }, { exerciseId: 'c' }];
  assert.equal(firstOccurrencePosition(before, 'c'), 3);

  const after = before.filter((e) => e.exerciseId !== 'b');
  assert.equal(firstOccurrencePosition(after, 'c'), 2);
});

test('ordinal handles the teens', () => {
  assert.equal(ordinal(1), '1st');
  assert.equal(ordinal(2), '2nd');
  assert.equal(ordinal(3), '3rd');
  assert.equal(ordinal(4), '4th');
  assert.equal(ordinal(11), '11th');
  assert.equal(ordinal(12), '12th');
  assert.equal(ordinal(13), '13th');
  assert.equal(ordinal(21), '21st');
});
