import assert from 'node:assert/strict';
import { test } from 'node:test';

import { bestSet, type RecordCandidate } from '../src/domain/records';

const set = (
  weightKg: number | null,
  reps: number,
  dayKey: string,
): RecordCandidate => ({ weightKg, reps, dayKey });

test('no sets means no record', () => {
  assert.equal(bestSet([]), null);
});

test('best is the heaviest weight, not the most reps', () => {
  const best = bestSet([
    set(60, 20, '2026-01-01'),
    set(100, 3, '2026-01-02'),
    set(80, 10, '2026-01-03'),
  ]);
  assert.equal(best?.weightKg, 100);
  assert.equal(best?.reps, 3);
});

test('tiebreak 1: most reps at the same weight', () => {
  const best = bestSet([
    set(100, 3, '2026-01-01'),
    set(100, 6, '2026-01-02'),
    set(100, 5, '2026-01-03'),
  ]);
  assert.equal(best?.reps, 6);
});

test('tiebreak 2: the earliest date wins, not the latest repeat', () => {
  const best = bestSet([
    set(100, 5, '2026-03-01'),
    set(100, 5, '2026-01-15'),
    set(100, 5, '2026-02-01'),
  ]);
  assert.equal(best?.dayKey, '2026-01-15');
});

test('bodyweight exercises are ranked by most reps in a single set', () => {
  const best = bestSet([
    set(null, 8, '2026-01-01'),
    set(null, 14, '2026-01-02'),
    set(null, 11, '2026-01-03'),
  ]);
  assert.equal(best?.weightKg, null);
  assert.equal(best?.reps, 14);
});

test('bodyweight bests also tiebreak on the earliest date', () => {
  const best = bestSet([
    set(null, 12, '2026-05-01'),
    set(null, 12, '2026-02-02'),
  ]);
  assert.equal(best?.dayKey, '2026-02-02');
});

test('a single loaded set outranks every unweighted one', () => {
  // A weighted pull-up is strictly the better lift, so a 20-rep unweighted set
  // must not outrank it.
  const best = bestSet([
    set(null, 20, '2026-01-01'),
    set(10, 5, '2026-01-02'),
    set(null, 18, '2026-01-03'),
  ]);
  assert.equal(best?.weightKg, 10);
  assert.equal(best?.reps, 5);
});

test('a zero-weight set is weighted, and beats bodyweight sets', () => {
  // 0 is a real logged value (an empty barbell), distinct from "no weight".
  const best = bestSet([set(null, 30, '2026-01-01'), set(0, 5, '2026-01-02')]);
  assert.equal(best?.weightKg, 0);
});

test('the best is derived, so removing it promotes the next best', () => {
  const all = [
    set(140, 2, '2026-01-01'),
    set(120, 5, '2026-01-02'),
    set(100, 8, '2026-01-03'),
  ];
  assert.equal(bestSet(all)?.weightKg, 140);

  const afterDeletingThatSession = all.filter((c) => c.dayKey !== '2026-01-01');
  assert.equal(bestSet(afterDeletingThatSession)?.weightKg, 120);
});
