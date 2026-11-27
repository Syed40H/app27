# Repa

**The gym log that remembers how tired you were.**

Every workout tracker shows you what you lifted last time. None of them tell you
*when* in the session you lifted it — so 185 × 8 looks identical whether it was
your opening set or your fifth exercise in. One of those is a plateau. The other
is a personal best.

Repa shows both. Pick an exercise at the machine and you get last session's
weight and reps, plus where in that session it fell.

iOS · Expo / React Native / TypeScript · entirely on-device

---

## The problem

Progressive overload only works if you can compare like with like. In practice,
nobody can:

- You bench 185 × 8 fresh on Monday. On Thursday you bench 185 × 6, but it was
  your fourth exercise. Did you get weaker? **No — and every app on the market
  tells you that you did.**
- The usual workaround is a rigid programme where order never changes. That works
  until you walk in and the squat rack is taken.
- So people log numbers they can't interpret, and eventually stop logging.

The missing variable isn't weight or reps. It's fatigue, and it's already sitting
in the data — nobody surfaces it.

## How it works

Tap an exercise. Before you type anything, Repa fills the row with ghost numbers
from your last session, and shows a badge if the position changed:

```
Bench Press                        was #1 → now #4
┌──────────────────────────────────────────────┐
│ Set 1    185 lb × 8      (185 × 8 last time) │
│ Set 2    185 lb × 6      (185 × 8 last time) │
└──────────────────────────────────────────────┘
```

That badge is the entire product thesis. Two rules make it work:

1. **It only appears when the position actually changed.** Same slot as last
   time, no badge. Silence is what makes it mean something when it shows up.
2. **Position is derived at read time, never stored.** Reorder your session,
   delete an exercise, and every badge stays correct — because there's no
   denormalised number to drift out of sync.

Ghost numbers come from the single most recent session containing that exercise.
Set 1 ghosts set 1. Add a fourth set today and it ghosts last time's final set,
which is the honest comparison.

## Why it's different

|  | Hevy · Strong · Jefit | Repa |
|---|---|---|
| Previous weight & reps | ✅ | ✅ |
| **Position in session** | ❌ | ✅ |
| Account required | ✅ | ❌ |
| Works offline | partly | always |
| Data leaves the device | ✅ | ❌ never |

## Private by construction

Not a policy — an architecture. There is no backend to leak.

- **Zero network calls.** Not analytics, not crash reporting, not a font fetch.
- **Zero accounts.** No login, no email, no onboarding. Install and start lifting.
- **One permission:** the camera, and only if you add your own exercise photo.
- App Store privacy label: **Data Not Collected**.

Your training history lives in a SQLite file on your phone and goes nowhere else.

## Screenshots

_Coming — drop three PNGs into `docs/screenshots/` named `workouts.png`,
`session.png` and `records.png`, then delete this line and uncomment the table
below._

<!--
| Workouts | Session | Records |
|---|---|---|
| ![Workouts](docs/screenshots/workouts.png) | ![Session](docs/screenshots/session.png) | ![Records](docs/screenshots/records.png) |
-->


## Design

**Paper and ink.** Warm off-white, near-black text, one burnt-orange accent —
deliberately light, because Hevy, Strong and Fitbod are all dark and this is
instantly distinguishable in a screen recording.

The accent is reserved for exactly three things: the active set, the Finish
Workout button, and a new personal record. Everything else earns attention
through type and space.

Built for the actual context — standing, one-handed, sweaty, between sets. Tap
targets are thumb-sized, inputs are 28px minimum, and numbers are set in tabular
figures so a weight doesn't jitter while you type it.

Every exercise carries original line-art on a tinted tile. The art is **drawn,
not sourced**: 21 pictograms defined once as vector data in
`src/data/pictograms.ts`, covering all 70 built-in exercises. The app renders
them with `react-native-svg`, and the same data rasterises to a PNG contact
sheet so the art could be reviewed rather than guessed at:

```powershell
npx tsc -p tsconfig.test.json; node scripts/preview-pictograms.js
```

## Running it

Requires Node 20+, and the **Expo Go** app on an iPhone.

```powershell
npm install
```

```powershell
npm start
```

Scan the QR code with the iPhone Camera app. Phone and computer need to be on
the same Wi-Fi. iOS-only by design.

The app opens empty — there is no sample data in a normal build, by design. To
see it populated (for screenshots, or to watch the position badge work without
logging six sessions first):

```powershell
$env:EXPO_PUBLIC_DEMO_SEED = '1'; npx expo start --clear
```

Sample data only seeds a database with no sessions of its own, so it can never
mix into real data.

## Architecture

```
src/
  app/            screens (Expo Router)
    (tabs)/       Workouts · Records · Settings
    session/[id]  a single workout
    exercise/[id] one exercise: all-time best + last 3 sessions
    history       every session, grouped by month
  components/     UI building blocks
  db/             schema, migrations, every query
  domain/         pure logic — no React, no SQLite, fully unit tested
  data/           built-in exercises, pictograms, art mapping, demo seed
  media/          camera capture and photo storage
  state/          unit preference, data-loading hook
  theme/          design tokens
```

Three decisions carry most of the weight:

**`src/domain` contains no React and no SQLite.** The rules that would be
expensive to get wrong — ghost mapping, badge visibility, record tiebreaks, unit
conversion — are plain functions, tested directly with no renderer and no
database.

**Weights are stored in canonical kilograms** and converted only at the display
and input boundary. The stored value is never rounded, so switching lb ↔ kg
round-trips without drift.

**Records are derived, never stored.** Delete the session that held a best and
the next-best is simply recomputed, instead of leaving an orphaned row claiming
a lift that no longer exists.

## Checks

```powershell
npm run typecheck
```

```powershell
npm test
```

79 unit tests, aimed at the places where a bug would be *silent* rather than
loud: ghost-set mapping, when the badge appears, the records tiebreak, unit
round-tripping, weekly streak boundaries, and that every built-in exercise maps
to a pictogram.

One of those tests caught a real bug: a keyword pattern ordered `press` above
`leg press`, which sent a custom "Leg Press" to the overhead-press drawing.

## Status

Feature-complete and typechecking; 79/79 tests pass. Pre-release — not yet on
the App Store. See [`SHIPPING.md`](SHIPPING.md) for the remaining checklist and
[`CLAUDE.md`](CLAUDE.md) for the design brief and the reasoning behind the
non-obvious calls.

Release builds go through EAS, which runs on Windows:

```powershell
npx eas-cli build --profile production --platform ios
```

## Deliberately not building

Charts and progress graphs · rest timers · programmes and templates · estimated
1RM · social feed · cloud sync · ads.

Every one of those is in competing apps. Each is also a reason the log takes
longer than the set does. Repa does one thing other apps don't, and nothing they
already do well.
