/**
 * Repa design tokens — "paper and ink".
 *
 * The app replaces a gym notebook, so it reads like one: warm off-white paper,
 * near-black ink, and a single burnt-orange accent used almost nowhere.
 */

export const color = {
  /** App background — warm off-white paper. */
  bg: '#FAF8F5',
  /** Cards, with a soft shadow. */
  card: '#FFFFFF',
  /** Primary text. */
  ink: '#1A1A1A',
  /** Secondary text, labels. */
  muted: '#8A8580',
  /** Previous-session ghost numbers: ink @ 35%. */
  ghost: 'rgba(26, 26, 26, 0.35)',
  /** Burnt orange. Reserved for exactly three things — see `accentUse`. */
  accent: '#E8552D',

  /** Supporting neutrals, derived from ink so the palette stays closed. */
  hairline: 'rgba(26, 26, 26, 0.08)',
  hairlineStrong: 'rgba(26, 26, 26, 0.14)',
  pressed: 'rgba(26, 26, 26, 0.05)',
  /** Destructive actions only (delete confirmations). */
  danger: '#C0392B',
  /** Accent at low opacity, for the active-set wash and PR pills. */
  accentWash: 'rgba(232, 85, 45, 0.08)',
  accentEdge: 'rgba(232, 85, 45, 0.35)',
  /** Scrim behind modals. */
  scrim: 'rgba(26, 26, 26, 0.35)',
} as const;

/**
 * The accent is reserved for exactly three things. Documented here so the rule
 * survives future edits: if you are reaching for `color.accent` and your case is
 * not in this list, use `ink` or `muted` instead.
 */
export const accentUse = ['active set', 'finish workout button', 'new personal record'] as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

/**
 * Numbers use tabular figures so a weight does not jitter while it is typed.
 * `fontVariant` is honoured on iOS, which is the only platform this ships to.
 */
export const tabularNums = { fontVariant: ['tabular-nums' as const] };

export const type = {
  /** Set inputs. 28px minimum — readable at arm's length, mid-set. */
  input: { fontSize: 30, fontWeight: '600' as const, ...tabularNums },
  /** Big screen titles. */
  title: { fontSize: 30, fontWeight: '700' as const, letterSpacing: -0.5 },
  /** Card headings, exercise names. */
  heading: { fontSize: 19, fontWeight: '600' as const, letterSpacing: -0.2 },
  body: { fontSize: 16, fontWeight: '500' as const },
  /** Secondary rows, dates. */
  small: { fontSize: 14, fontWeight: '500' as const },
  /** Section labels — uppercased, tracked out. */
  label: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.9 },
  /** Numbers in read-only positions (records, summaries). */
  numeral: { fontSize: 17, fontWeight: '600' as const, ...tabularNums },
} as const;

/** Soft card shadow. Kept subtle — paper resting on paper, not floating. */
export const cardShadow = {
  shadowColor: '#1A1A1A',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 3 },
} as const;

/** Minimum tap target. Used standing, one-handed, sweaty. */
export const HIT_SIZE = 44;
export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 } as const;

/**
 * Blend two hex colours. Used to derive the light and shadow tones that give
 * the exercise tiles and their artwork depth, so every shade stays a function of
 * the palette rather than another hardcoded value.
 *
 * @param amount 0 returns `a`, 1 returns `b`.
 */
export function mixHex(a: string, b: string, amount: number): string {
  const parse = (hex: string) => {
    const value = hex.replace('#', '');
    return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
  };
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const channel = (x = 0, y = 0) =>
    Math.round(x * (1 - amount) + y * amount)
      .toString(16)
      .padStart(2, '0');
  return `#${channel(ar, br)}${channel(ag, bg)}${channel(ab, bb)}`;
}
