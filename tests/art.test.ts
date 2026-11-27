import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BY_EXERCISE_ID, pictogramFor } from '../src/data/exerciseArt';
import { PICTOGRAMS, PICTOGRAM_BOX } from '../src/data/pictograms';
import { MUSCLE_GROUP_ORDER, SEED_EXERCISES } from '../src/data/exercises';
import { formatFullDate } from '../src/domain/dayKey';

test('every built-in exercise resolves to a pictogram that exists', () => {
  for (const exercise of SEED_EXERCISES) {
    const name = pictogramFor(exercise.id, exercise.name, exercise.muscleGroup);
    assert.ok(name in PICTOGRAMS, `${exercise.id} mapped to "${name}", which is not a pictogram`);
  }
});

test('every built-in exercise is mapped explicitly, not left to a fallback', () => {
  // A fallback is right for a name a user types, but a shipped exercise
  // reaching one means nobody chose its picture.
  const unmapped = SEED_EXERCISES.filter((e) => !(e.id in BY_EXERCISE_ID)).map((e) => e.id);
  assert.deepEqual(unmapped, [], `unmapped exercises: ${unmapped.join(', ')}`);
});

test('the explicit map has no entries for exercises that no longer exist', () => {
  const ids = new Set(SEED_EXERCISES.map((e) => e.id));
  const stale = Object.keys(BY_EXERCISE_ID).filter((id) => !ids.has(id));
  assert.deepEqual(stale, [], `stale pictogram mappings: ${stale.join(', ')}`);
});

test('every mapped pictogram name is real', () => {
  for (const [id, name] of Object.entries(BY_EXERCISE_ID)) {
    assert.ok(name in PICTOGRAMS, `${id} points at missing pictogram "${name}"`);
  }
});

test('every muscle group has a fallback picture', () => {
  for (const group of MUSCLE_GROUP_ORDER) {
    const name = pictogramFor('unknown-id-xyz', 'zzzqqq', group);
    assert.ok(name in PICTOGRAMS, `${group} has no fallback pictogram`);
  }
});

test('a typed custom name still gets a fitting picture', () => {
  assert.equal(pictogramFor('x1', 'Incline Bench', 'Custom'), 'benchPress');
  assert.equal(pictogramFor('x2', 'Pendlay Row', 'Custom'), 'row');
  assert.equal(pictogramFor('x3', 'Zercher Squat', 'Custom'), 'squat');
  assert.equal(pictogramFor('x4', 'Preacher Curls', 'Custom'), 'curl');
  assert.equal(pictogramFor('x5', 'Weighted Chin Up', 'Custom'), 'pullUp');
  assert.equal(pictogramFor('x6', 'Standing Calf Press', 'Custom'), 'calfRaise');
});

test('an unrecognisable custom name still gets something to draw', () => {
  const name = pictogramFor('x9', 'Zzzqqq', 'Custom');
  assert.equal(name, 'dumbbell');
  assert.ok(name in PICTOGRAMS);
});

test('no pictogram is empty', () => {
  for (const [name, primitives] of Object.entries(PICTOGRAMS)) {
    assert.ok(primitives.length > 0, `${name} has nothing to draw`);
  }
});

test('pictogram geometry stays inside its box', () => {
  for (const [name, primitives] of Object.entries(PICTOGRAMS)) {
    for (const primitive of primitives) {
      const points: number[] = [];
      if (primitive.k === 'line') {
        points.push(primitive.x1, primitive.y1, primitive.x2, primitive.y2);
      } else if (primitive.k === 'circle') {
        points.push(
          primitive.cx - primitive.r,
          primitive.cy - primitive.r,
          primitive.cx + primitive.r,
          primitive.cy + primitive.r,
        );
      } else {
        points.push(...primitive.pts);
      }

      for (const value of points) {
        // A little slack for the stroke width at the very edge of the box.
        assert.ok(
          value >= -2 && value <= PICTOGRAM_BOX + 2,
          `${name} has a co-ordinate outside the box: ${value}`,
        );
      }
    }
  }
});

test('a polyline has an even co-ordinate count and at least two points', () => {
  for (const [name, primitives] of Object.entries(PICTOGRAMS)) {
    for (const primitive of primitives) {
      if (primitive.k !== 'poly') continue;
      assert.equal(primitive.pts.length % 2, 0, `${name} has an odd co-ordinate count`);
      assert.ok(primitive.pts.length >= 4, `${name} has a poly with fewer than two points`);
    }
  }
});

test('the date line under a workout name is always a real date', () => {
  const today = new Date(2026, 8, 9);
  // Never "Today" — that is the headline's job when a workout has no name.
  assert.match(formatFullDate('2026-09-09', today), /Wed 9 Sep/);
  assert.match(formatFullDate('2026-09-08', today), /Tue 8 Sep/);
  assert.match(formatFullDate('2025-12-25', today), /2025/);
});
