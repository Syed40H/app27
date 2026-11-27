import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  formatSet,
  formatWeight,
  KG_PER_LB,
  parseRepsInput,
  parseWeightInput,
  roundForDisplay,
  toCanonical,
  toUnit,
} from '../src/domain/units';

test('pounds convert by the exact definition of the pound', () => {
  assert.equal(toCanonical(1, 'lb'), KG_PER_LB);
  assert.equal(KG_PER_LB, 0.45359237);
});

test('kilograms are the canonical unit and pass through untouched', () => {
  assert.equal(toCanonical(100, 'kg'), 100);
  assert.equal(toUnit(100, 'kg'), 100);
});

test('a weight entered in pounds displays as the same whole number', () => {
  const stored = toCanonical(185, 'lb');
  assert.equal(formatWeight(stored, 'lb'), '185');
});

test('converted values never show more than one decimal place', () => {
  const stored = toCanonical(185, 'lb');
  const shown = formatWeight(stored, 'kg');
  assert.equal(shown, '83.9');
  assert.ok(!shown.includes('83.91'), 'must not leak the full conversion');
});

test('a round kilogram value drops its trailing zero', () => {
  assert.equal(formatWeight(100, 'kg'), '100');
  assert.equal(formatWeight(82.5, 'kg'), '82.5');
});

test('toggling units repeatedly does not drift the stored number', () => {
  // The stored value is never rounded, so round-tripping is exact.
  let stored = toCanonical(225, 'lb');
  const original = stored;
  for (let i = 0; i < 50; i++) {
    stored = toCanonical(toUnit(stored, 'kg'), 'kg');
    stored = toCanonical(toUnit(stored, 'lb'), 'lb');
  }
  assert.ok(Math.abs(stored - original) < 1e-9, 'stored value drifted');
  assert.equal(formatWeight(stored, 'lb'), '225');
});

test('display rounding: whole pounds, one decimal kilograms', () => {
  assert.equal(roundForDisplay(184.6, 'lb'), 185);
  assert.equal(roundForDisplay(83.9146, 'kg'), 83.9);
});

test('an empty weight is bodyweight (null), never zero', () => {
  assert.equal(parseWeightInput('', 'lb'), null);
  assert.equal(parseWeightInput('   ', 'kg'), null);
});

test('zero is a real weight and is kept as zero', () => {
  assert.equal(parseWeightInput('0', 'kg'), 0);
  assert.notEqual(parseWeightInput('0', 'kg'), null);
});

test('a comma decimal separator is accepted', () => {
  assert.equal(parseWeightInput('82,5', 'kg'), 82.5);
});

test('nonsense and negative weights are rejected as bodyweight', () => {
  assert.equal(parseWeightInput('abc', 'kg'), null);
  assert.equal(parseWeightInput('-20', 'kg'), null);
});

test('reps must be a whole number of at least one', () => {
  assert.equal(parseRepsInput('8'), 8);
  assert.equal(parseRepsInput('0'), null);
  assert.equal(parseRepsInput('-3'), null);
  assert.equal(parseRepsInput('8.5'), null);
  assert.equal(parseRepsInput(''), null);
});

test('a bodyweight set reads as reps alone, not as 0 lb', () => {
  assert.equal(formatSet(null, 12, 'lb'), '12 reps');
  assert.equal(formatSet(null, 1, 'lb'), '1 rep');
  assert.ok(!formatSet(null, 12, 'lb').includes('0'));
});

test('a weighted set reads as weight by reps', () => {
  assert.equal(formatSet(toCanonical(185, 'lb'), 6, 'lb'), '185 lb × 6');
  assert.equal(formatSet(100, 5, 'kg'), '100 kg × 5');
});
