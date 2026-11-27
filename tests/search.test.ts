import assert from 'node:assert/strict';
import { test } from 'node:test';

import { editDistance, isSubsequence, matchScore, searchByName } from '../src/domain/search';
import { monogramInitials, monogramTint, MONOGRAM_TINTS } from '../src/domain/monogram';
import { dayKeyOf, formatDayKey, monthKeyOf } from '../src/domain/dayKey';

const NAMES = [
  'Bench Press',
  'Incline Bench Press',
  'Barbell Row',
  'Back Squat',
  'Deadlift',
  'Lat Pulldown',
  'Pull-Ups',
  'Overhead Press',
];

const find = (query: string) => searchByName(NAMES, query, (n) => n);

test('an exact name ranks first', () => {
  assert.equal(find('Bench Press')[0], 'Bench Press');
});

test('a prefix beats a mere substring', () => {
  // "Bench Press" starts with the query; "Incline Bench Press" only contains it.
  assert.equal(find('bench')[0], 'Bench Press');
  assert.ok(find('bench').includes('Incline Bench Press'));
});

test('a dropped vowel still finds the lift', () => {
  assert.ok(find('bnch').includes('Bench Press'), 'bnch should find Bench Press');
});

test('a transposition still finds the lift', () => {
  assert.ok(find('benhc').includes('Bench Press'), 'benhc should find Bench Press');
});

test('multiple partial words match', () => {
  assert.equal(find('bench pr')[0], 'Bench Press');
});

test('initials match', () => {
  assert.ok(find('bp').includes('Bench Press'));
});

test('an empty query returns everything in its original order', () => {
  assert.deepEqual(find(''), NAMES);
  assert.deepEqual(find('   '), NAMES);
});

test('a query that matches nothing returns nothing', () => {
  assert.deepEqual(find('xylophone'), []);
});

test('search is accent- and case-insensitive', () => {
  assert.ok(searchByName(['Pec Deck'], 'PÉC', (n) => n).length === 1);
});

test('edit distance abandons early past its budget', () => {
  assert.equal(editDistance('bench', 'bench', 2), 0);
  assert.equal(editDistance('bnch', 'bench', 2), 1);
  assert.ok(editDistance('bench', 'deadlift', 2) > 2);
});

test('subsequence matching', () => {
  assert.ok(isSubsequence('bnch', 'bench'));
  assert.ok(!isSubsequence('hcneb', 'bench'));
});

test('monogram initials: one word gives one letter, more give two', () => {
  assert.equal(monogramInitials('Deadlift'), 'D');
  assert.equal(monogramInitials('Bench Press'), 'BP');
  assert.equal(monogramInitials('Incline Bench Press'), 'IB');
});

test('monogram initials treat a hyphen as a word break', () => {
  assert.equal(monogramInitials('Pull-Ups'), 'PU');
  assert.equal(monogramInitials('T-Bar Row'), 'TB');
});

test('monogram initials survive junk input', () => {
  assert.equal(monogramInitials(''), '?');
  assert.equal(monogramInitials('   '), '?');
});

test('a monogram tint is stable for a name and ignores case and padding', () => {
  const a = monogramTint('Bench Press');
  assert.equal(a, monogramTint('Bench Press'));
  assert.equal(a, monogramTint('  bench press  '));
  assert.ok(MONOGRAM_TINTS.includes(a as (typeof MONOGRAM_TINTS)[number]));
});

test('day keys are local, not UTC', () => {
  // 23:30 local must stay on its own local day, whatever the timezone offset is.
  const late = new Date(2026, 8, 9, 23, 30, 0);
  assert.equal(dayKeyOf(late), '2026-09-09');

  const earlyNextDay = new Date(2026, 8, 10, 0, 15, 0);
  assert.equal(dayKeyOf(earlyNextDay), '2026-09-10');
});

test('day keys zero-pad months and days', () => {
  assert.equal(dayKeyOf(new Date(2026, 0, 5)), '2026-01-05');
});

test('today and yesterday are named, older days are dated', () => {
  const today = new Date(2026, 8, 9, 12, 0, 0);
  assert.equal(formatDayKey('2026-09-09', today), 'Today');
  assert.equal(formatDayKey('2026-09-08', today), 'Yesterday');
  assert.match(formatDayKey('2026-09-01', today), /Sep/);
  // A different year is disambiguated.
  assert.match(formatDayKey('2025-09-01', today), /2025/);
});

test('history groups by month', () => {
  assert.equal(monthKeyOf('2026-09-09'), '2026-09');
});
