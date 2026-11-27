# Project: Repa — gym rep tracker

**App name:** Repa · **Store listing:** Repa - Gym Workout Tracker

This is the living brief. It started from the original spec and now records the
decisions made since, including the places where the build deliberately differs
from that spec. **Where this file and the original disagree, this file wins.**

---

## What it is

An Expo / React Native / TypeScript iOS app for logging strength workouts.

Pick an exercise at the machine and it immediately shows what you did last time —
weight, reps per set, and **where in that session it fell**, so you know whether
those numbers came from being fresh or four exercises deep.

### The one feature that matters

Exercise recall with fatigue context. Hevy, Strong and Jefit all show previous
values; none tell you the position. The position badge is a headline feature,
not a detail. Everything else is supporting cast.

---

## Hard constraints (unchanged)

- Expo / React Native / TypeScript, Expo Router. No `expo prebuild`, no custom
  native modules, no checked-in `ios/`.
- Develop in Expo Go on a physical iPhone. Release via **EAS Build** + **EAS
  Submit**, both of which work on Windows.
- **All data on-device** in `expo-sqlite`. No backend, accounts, sync, or network
  calls of any kind. No login, no onboarding.
- Camera is the **only** permission.
- TypeScript strict. Run `npm run typecheck` and `npm test` before claiming
  anything works.

---

## Current state

Everything below is built, typechecked and bundling. **79 unit tests pass.**

| Command | What it does |
|---|---|
| `npx expo start` | Dev server; scan with Expo Go |
| `npm run typecheck` | `tsc --noEmit`, strict |
| `npm test` | 79 tests over the pure domain logic |
| `npx expo export --platform ios` | Full production bundle — the real build check |
| `node scripts/generate-icons.js` | Regenerates the app icon |
| `npx tsc -p tsconfig.test.json && node scripts/preview-pictograms.js` | Renders the exercise art to a PNG to review |

Screens: Workouts / Records / Settings tabs, plus pushed Session, History and
Exercise detail. SQLite schema is at v1 with a migration runner.

### Not verified

Nothing has been run on a physical device. Everything visual, every gesture
(swipe-to-delete), the camera flow, and haptics are unconfirmed from this side.

---

## Changes from the original spec

These are deliberate. Each one has a reason; revisit them, don't reverse them by
accident.

### Requested by the user

1. **The repeat button is gone.** Removed from every card and from History; the
   `repeatSession` query was deleted rather than left as dead code.
2. **The workout's name is the card headline**, with the date underneath. An
   unlabelled workout falls back to the friendly day ("Today") as the headline so
   it is never blank. The date line always shows a real date, never "Today".
3. **No "Resume".** The button reads **New session**, or **Keep going** when a
   workout is open.
4. **The unit (lb/kg) appears on every set row**, following the Settings toggle.
5. **Exercises have pictures** — see below.
6. **The session label is set by tapping the workout name.** There is no separate
   label chip.

### Judgement calls worth knowing about

7. **Kilograms display to 0.1, not 0.5.** The original says "nearest 0.5 kg" but
   its own worked example says "83.9 kg", which 0.5 rounding would render as
   84.0 — and it would also mangle a value the user typed themselves. The
   example won. Pounds still round to whole numbers.
8. **The main page shows the featured card plus the next 3**, not 3 including
   the featured one, so the same workout never appears twice.
9. **Exercise cards grow and the page scrolls**, rather than scrolling inside the
   card. Two scroll views fighting over the same vertical drag is worse to use
   than a slightly longer page.
10. **Time- and distance-based movements are excluded** from the built-in list
    (plank, farmer's walk, dead hang). Every set here is weight-and-reps, and
    logging a 45-second plank as "45 reps" would be a lie in the data. Users can
    still add them as custom exercises.
11. **A `Custom` muscle group exists.** Typing a name at a machine should not
    also demand a taxonomy decision, so custom exercises land there.
12. **70 built-in exercises**, not ~60.
13. **Photos work for any exercise**, not only custom ones, and are managed on
    the exercise detail screen — away from the machine, since a photo sticks to
    that name forever.
14. **Weight writes through on every keystroke; the screen re-reads on blur.**
    Reloading the whole session per character was rebuilding everything
    mid-entry.

### Added for engagement

The user said the main page and Records did not excite them. These are the
additions; they are the most removable part of the app if the mood changes.

15. **Week strip and streak** on Workouts: seven day-dots, ticked when trained,
    today ringed, future days dashed rather than marked as misses.
    - The streak counts **weeks, not days**. Rest days are part of training, and
      a daily counter would punish following a programme correctly.
    - An empty current week does **not** reset it — otherwise every Monday
      morning would wipe a streak someone had earned.
    - ⚠️ This brushes against "no charts or progress graphs". It is a
      consistency indicator, not a performance chart. Delete `WeekStrip` and its
      two queries if you disagree.
16. **Workout colours.** Each card carries the colour of its split down the left
    edge. Derived, never random: Push is always blue, Pull teal, Legs violet. An
    unlabelled workout borrows the colour of its first exercise's muscle group.
    None of the seven collide with the accent — there is a test for that.
17. **Records** has a three-stat header (heaviest lift / exercises tracked / new
    PRs), muscle-group sections, big numerals, and an accent **NEW** badge on
    anything set in the last 14 days. That badge is a sanctioned accent use.

---

## Visual direction: paper and ink

A light app, deliberately — Hevy, Strong and Fitbod are all dark, so this is
instantly recognisable in a screen recording.

| Token | Value | Use |
|---|---|---|
| `bg` | `#FAF8F5` | app background |
| `card` | `#FFFFFF` | cards, soft shadow |
| `ink` | `#1A1A1A` | primary text |
| `muted` | `#8A8580` | secondary text |
| `ghost` | `#1A1A1A` @ 35% | previous-session ghost numbers |
| `accent` | `#E8552D` | burnt orange — **sparingly** |

**The accent is reserved for exactly three things:** the active set, the Finish
Workout button, and a new personal record. The streak pill and the Records NEW
badge both fall under "a new personal record". Nothing else.

Workout colours (`domain/workoutColor.ts`) are a separate, muted system for
telling cards apart. They are not the accent and must never be mistaken for it.

Numbers use tabular figures so weights don't jitter while typing. Set inputs are
28px minimum. Tap targets are thumb-sized — this is used standing, one-handed,
sweaty.

---

## Exercise art

Original line-art pictograms, 21 of them, covering all 70 built-ins.

- **Drawn, not sourced.** Icon sets are licensed or attribution-encumbered, and
  images scraped from search results are grounds for App Store rejection.
- Defined **once as data** in `src/data/pictograms.ts` (lines, circles,
  polylines in a 48×48 box).
- The app renders them with `react-native-svg`;
  `scripts/preview-pictograms.js` rasterises the *same data* to a PNG contact
  sheet, so the art can be reviewed rather than imagined. **Use it whenever you
  touch the art.**
- Depth comes from drawing each three times: a darker copy offset down-right for
  thickness, the ink, then a fine light pass on the top-left edge — on a
  gradient tile. Tiles under 30px skip the extra passes; below that it turns to
  mud.
- Mapping lives in `src/data/exerciseArt.ts`: explicit per exercise id, then
  keyword match for typed names, then muscle group, then a dumbbell. **Keyword
  order matters — specific before generic**, or "Leg Press" gets the
  overhead-press drawing.
- A user photo overrides the pictogram.

Tests assert every built-in is mapped explicitly, no mapping is stale, and all
geometry stays inside the box.

---

## Core rules (unchanged, and load-bearing)

- **Ghost numbers** come from the single most recent session containing that
  exercise. Set 1 ghosts set 1; extra sets today ghost last time's final set.
- **The position badge appears only when the position differs from last time.**
  Silence when it matches is what makes it mean something when it appears. No
  history means no badge at all.
- **Positions are derived from stored order at read time**, never stored.
- **Same exercise twice in one session** references the first occurrence, for
  both badge and ghosts.
- **Weight is optional** (bodyweight) and stored as `null`, never `0`. Reps are
  always required.
- **An empty session is discarded on Finish** and never becomes the previous-
  session card.
- **Nothing is ever pruned.** The "last 3" rule is about what the recall UI
  surfaces, not storage. Full sessions must survive intact — the position badge
  depends on it.
- **Records are derived, never stored**, so deleting the session that held a best
  recomputes it rather than orphaning a row.
- **Weights are stored in canonical kilograms**, converted only at the display
  and input boundary. Never round the stored value.
- **Day keys are local midnight**, computed in the device's timezone.
- **Schema is versioned from v1 with migrations.** Never drop tables on upgrade.

---

## Layout

```
src/
  app/            screens (Expo Router)
    (tabs)/       Workouts, Records, Settings
    session/[id]  a single workout
    exercise/[id] one exercise: all-time best + last 3 sessions
    history       every session ever, grouped by month
  components/     UI building blocks
  db/             schema, migrations, every query
  domain/         pure logic — no React, no SQLite, fully unit tested
  data/           built-in exercises, pictograms, art mapping, demo seed
  media/          camera capture and photo storage
  state/          unit preference, data-loading hook
  theme/          design tokens
```

`src/domain` is deliberately free of React and SQLite so the rules that matter
can be tested directly. Put logic there, not in a component.

---

## Not building

Charts and progress graphs, rest timers, workout programs or templates, ads,
accounts, cloud sync, social features, estimated 1RM, Home Screen widget (v1.1).

If one of these seems needed, say so — don't add it.

---

## Before it can ship

See `SHIPPING.md` for the full checklist. The blocking items:

- [ ] **Reserve the name** in App Store Connect early — the `Rep-` prefix is
      crowded and Apple may flag it as similar to "Rep - Workout Tracker".
- [ ] **Set the bundle identifier** before the first build; it cannot change
      afterwards. Currently `com.hadisyed.repa`.
- [ ] **EAS project id** — `app.json` → `expo.extra.eas.projectId` is empty.
- [ ] **Privacy policy URL** — `PRIVACY_POLICY_URL` in `app/(tabs)/settings.tsx`
      is a placeholder, and it must match the App Store Connect listing.
- [ ] **Support URL**, age rating.
- [ ] **Replace the app icon** if you want something more crafted than the
      generated monogram R. The current one is valid (1024², opaque, square).
- [ ] **Test on a physical device** — nothing visual has been confirmed.
- [ ] **Record the demo video** for App Review Notes (see below).

### Guideline 4.2 — the main rejection risk

Apple rejects apps that don't *appear* finished, on a 30–90 second first run.

Sample data must never reach real users, and only one binary is submitted — so
the reviewer's build *is* the production build and will start empty. The
mitigation is therefore the original spec's own fallback: **a demo video in App
Review Notes**, recorded from the `demo` EAS profile, which bakes in sample
workouts. Never submit that profile.

Privacy nutrition label is the simplest case: **Data Not Collected**.

---

## Working agreements

- **Ask before committing or pushing.** (User is new to git.)
- Never claim something works without typechecking it. State plainly what could
  not be verified from your side — anything visual, anything needing the device.
- Prefer deciding and flagging over asking. Where a call is genuinely the user's,
  make the call, say what you assumed, and offer to reverse it.
