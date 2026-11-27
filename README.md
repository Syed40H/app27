# Repa

A gym rep tracker. Pick an exercise at the machine and it immediately shows what
you did last time — weight, reps per set, and **where in that session it fell**,
so you know whether those numbers came from a fresh start or from four exercises
deep.

Every competitor shows previous values. None of them tell you the fatigue
context. That gap is the whole point of this app.

- Expo / React Native / TypeScript, Expo Router
- All data on-device in SQLite. No backend, no account, no sync, no network calls
- Camera is the only permission, used for photos on custom exercises

## Running it

```bash
npm install
npx expo start
```

Scan the QR code with the Camera app on an iPhone running **Expo Go**. The app is
iOS-only by design.

To see it with sample workouts already in it (for screenshots, or to look at the
position badge without logging six sessions first):

```bash
EXPO_PUBLIC_DEMO_SEED=1 npx expo start --clear
```

Sample data only seeds into a database with no sessions of its own, so it can
never mix into real data.

## Checks

```bash
npm run typecheck   # tsc --noEmit, strict
npm test            # unit tests for the recall, records, units and search logic
```

The tests cover the parts where a bug would be silent and wrong rather than
loud: ghost-set mapping, when the position badge appears, the records tiebreak,
and unit conversion round-tripping.

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
  data/           the built-in exercise list, and demo seed data
  media/          camera capture and photo storage
  state/          unit preference, data-loading hook
  theme/          design tokens
```

`src/domain` is deliberately free of React and SQLite so the rules that matter
can be tested directly.

## Design

Paper and ink: a warm off-white background, near-black text, and a single
burnt-orange accent. The accent is reserved for exactly three things — the
active set, the Finish Workout button, and a new personal record. Numbers use
tabular figures so a weight does not jitter while it is typed.

Every exercise has a drawn line-art pictogram on a tinted tile. The art is
original, defined once as data in `src/data/pictograms.ts`: the app renders it
with react-native-svg, and `scripts/preview-pictograms.js` rasterises the same
data to a PNG contact sheet so it can be reviewed rather than guessed at.

```bash
npx tsc -p tsconfig.test.json && node scripts/preview-pictograms.js
```

A user photo taken on the exercise's detail screen replaces the pictogram, and
sticks to that exercise name from then on.

## Shipping

Expo Go is a development tool only. Release builds go through EAS, which works
on Windows:

```bash
npx eas-cli build --profile production --platform ios
npx eas-cli submit --platform ios
```

`eas.json` also has a `demo` profile, which bakes in the sample data for
screenshots and review video. Do not ship that profile to the App Store.

Before submitting, see `SHIPPING.md`.
