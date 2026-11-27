/**
 * Exercise search for the picker.
 *
 * Typed one-handed, standing at a machine, so it has to survive typos and
 * partial words: "bnch" and "benhc" and "bench pr" all need to find Bench Press.
 * The list is small (a couple of hundred entries at most), so this can afford to
 * be generous rather than clever.
 */

/** Lowercase, strip accents, collapse whitespace. */
export function normalize(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Levenshtein distance, abandoned early once it exceeds `max`. */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  if (a === b) return 0;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    let rowMin = curr[0]!;
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(prev[j]! + 1, curr[j - 1]! + 1, prev[j - 1]! + cost);
      if (curr[j]! < rowMin) rowMin = curr[j]!;
    }
    if (rowMin > max) return max + 1;
    [prev, curr] = [curr, prev];
  }

  return prev[b.length]!;
}

/** True if every character of `query` appears in `text`, in order. */
export function isSubsequence(query: string, text: string): boolean {
  let qi = 0;
  for (let ti = 0; ti < text.length && qi < query.length; ti++) {
    if (text.charCodeAt(ti) === query.charCodeAt(qi)) qi++;
  }
  return qi === query.length;
}

/**
 * How well `name` matches `query`. Higher is better; `0` means no match.
 *
 * The tiers are deliberately far apart so a real prefix match can never be
 * outranked by a fuzzy one — an exact "row" should put Row above Barbell Row,
 * not bury it under everything containing those three letters.
 */
export function matchScore(name: string, query: string): number {
  const n = normalize(name);
  const q = normalize(query);
  if (q === '') return 1;
  if (n === q) return 1000;
  if (n.startsWith(q)) return 900 - n.length;

  const words = n.split(' ');
  if (words.some((w) => w.startsWith(q))) return 800 - n.length;
  if (n.includes(q)) return 700 - n.length;

  // Every typed token is a prefix of some word: "bench pr" -> "bench press".
  const tokens = q.split(' ').filter(Boolean);
  if (tokens.length > 1 && tokens.every((t) => words.some((w) => w.startsWith(t)))) {
    return 600 - n.length;
  }

  // Initials: "bp" -> "Bench Press".
  if (words.length > 1 && words.map((w) => w.charAt(0)).join('').startsWith(q)) {
    return 550 - n.length;
  }

  if (isSubsequence(q.replace(/ /g, ''), n.replace(/ /g, ''))) return 400 - n.length;

  // Typo tolerance, scaled so short queries cannot fuzz into everything.
  const budget = q.length <= 3 ? 1 : q.length <= 6 ? 2 : 3;
  if (editDistance(q, n, budget) <= budget) return 300 - n.length;
  if (words.some((w) => editDistance(q, w, budget) <= budget)) return 200 - n.length;

  return 0;
}

/**
 * Filter and rank `items` against `query`. An empty query returns everything in
 * its original order, so callers can use this for the unfiltered list too.
 */
export function searchByName<T>(
  items: T[],
  query: string,
  nameOf: (item: T) => string,
): T[] {
  if (normalize(query) === '') return items;

  return items
    .map((item, index) => ({ item, index, score: matchScore(nameOf(item), query) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((r) => r.item);
}
