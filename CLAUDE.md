@AGENTS.md

# Radio Trucker: project guide

A cozy, async-multiplayer game about a truck driver who finds work by tuning a radio. The design source of truth is [radio_trucker_gdd.md](radio_trucker_gdd.md). Read the relevant GDD section before you build a feature. If code and GDD disagree, ask; don't silently pick one.

**Core dilemma (keep every feature in service of it):** rebroadcasting a tip earns Likes (more radio range), but it shrinks the cargo left for you.

## Stack

| Concern | Choice | Why (GDD ref) |
|---|---|---|
| App framework | Expo SDK 57 + React Native 0.86, TypeScript strict | Mobile and PC targets (§2) |
| PC target | Expo **web** for now (browser tab / PWA). Add a desktop wrapper (Tauri/Electron) later only if needed | PC "alt-tab" play (§2, §8) |
| Navigation | `expo-router`, routes in `src/app/` | |
| Radio audio | `react-native-audio-api` (Web Audio API for RN, works on web too) | Procedural static, tuning sweeps, filters, signal crossfade, processed voice (§5, §10) |
| Dial / meters / map | `react-native-svg` + `react-native-gesture-handler` + `react-native-reanimated` | Drag-to-tune dial, signal meter, simple route map (§5.1, §10) |
| Haptics | `expo-haptics` | Detent feel when you land on a frequency |
| State | `zustand` (+ `persist` middleware) | |
| Persistence | `@react-native-async-storage/async-storage` | Save game, signal log (§8) |
| Notifications | `expo-notifications` (+ `expo-device`) | Arrivals, strong signals, character broadcasts (§8) |
| Tests | `jest-expo`, `@testing-library/react-native` | |

**Deliberately not added yet:**
- **Multiplayer backend** (§9). Pick one (e.g. Supabase) once the single-player loop is validated. Keep a `BroadcastFeed` interface so NPC broadcasts and real-player broadcasts come from the same source.
- **Maps SDK.** The map is a stylized SVG, not real geography (§10, §11 setting is open).
- **Background tasks.** Real-time travel is computed from timestamps (see below), so nothing has to run while the app is closed.

Install new packages with `npx expo install <pkg>`, never with plain `npm install`. After adding native code, Expo Go won't work. Use a dev build (`npx expo run:android`) or test on web.

## Architecture

```
src/
  app/          # Expo Router screens only: thin, no game logic
  game/         # PURE TypeScript simulation: no React, no RN imports, no Date.now()
  gd/           # game design numbers: every value that tunes play (Likes, pay, fuel, odds, map distances)
  audio/        # react-native-audio-api graph: static noise, band filters, signal mix
  components/   # UI: Dial, SignalMeter, Dashboard, RouteMap, ...
  store/        # zustand stores; they call into game/ and persist state
  content/      # data: names and text for characters, places, cargo, phrases; numbers come from gd/
```

Rules:
1. **`src/game/` is pure and deterministic.** Functions take state, inputs, an explicit `now: number` (epoch ms) and an RNG from `createRng(seed)`. They return new state. No `Math.random()`, no `Date.now()`, no side effects. This makes the economy testable and tunable. The GDD (§12) says to validate the dilemma before building tuning, audio, or art.
2. **Time is data.** Trips, battery drain, signal decay, time-of-day propagation, and cargo depletion are all functions of `(startState, elapsedMs)`. On app resume, catch up by simulating from the last saved timestamp. Never rely on timers running in the background.
3. **No fail state** (§6). Money and fuel can run low, but there must always be a way to keep playing (e.g. low-pay local dispatcher jobs).
4. **Content is data.** Characters, bands, gear, and tip templates live in `src/content/` as typed objects. Don't hardcode them in components.
5. **Broadcasts are structured** (§9): `{ location, cargo, pay, phrases[] }`. Never free text, even for local/NPC content, so the same type works for multiplayer later.
6. **Placeholder names.** "Likes", the game name, and character names are placeholders (§11). Keep them in one constants/content file so renaming is a one-line change.

### `src/game/` map

| File | What it holds |
|---|---|
| `types.ts` | All sim types plus their string constants (`TIP_TRUTH`, `TIP_STATUS`, `ACTION_ERROR`) |
| `economy.ts` | Distance, fuel, trip time, cargo decay (`cargoAt`), rebroadcast cut, `estimateTrip` (claim-only, safe for UI) |
| `tips.ts` | `generateTip`: a `Broadcast` (the claim) plus a hidden `Job` (the reality). Scams have no job |
| `actions.ts` | `createGame`, `go`, `rebroadcast`, `ignore`, `refuel`, `takeLocalJob`. Each one calls `advance` first and returns an `ActionResult` |
| `advance.ts` | Catch-up to `now`: trip arrivals and delayed Likes, in time order. Returns `GameEvent`s (for notifications and audio cues later) |
| `sim.ts` | Paper-prototype strategy runner (`STRATEGY`, `DECISION`). `sim.test.ts` guards the dilemma under current balance |
| `test-fixtures.ts` | `TEST_WORLD` (home and a place 100 km away), `withTip`, `unwrap` |

Design decisions already made (change them in the GDD first):
- The player never sees `Tip.truth` or the `Job`. UI and strategies only use the `Broadcast`, the broadcaster and `estimateTrip`.
- Rebroadcast Likes settle after `likesSettleDelayMs`, so the result doesn't reveal right away whether a tip was good.
- You can't rebroadcast after committing to Go or Ignore. This blocks a "load the cargo, then share it" Likes exploit.
- A trip is a single leg: you're paid on arrival at the tip's location, and the truck stays there.

## Domain glossary

- **Signal / tip**: a broadcast on a frequency in a band. It carries location, cargo, pay, reliability, and a broadcaster.
- **Go / Rebroadcast / Ignore**: the three decisions (§3, §4). Rebroadcast cuts the remaining cargo sharply. Fuel cost doesn't change.
- **Bad tip**: outdated, exaggerated, or a scam. Rebroadcasting one costs Likes.
- **Radio limits** (§5.2): battery amperage, antenna/band match, time-of-day propagation, terrain/weather, interference. Each one changes the reception quality, and quality decides which message fields come through.
- **Signal log**: missed broadcasts you can replay. Details degrade with age.
- **Shift**: a ~15-minute session framing for mobile.

## UX constraints

- Taps and drags only. No keyboard needed, no text entry in gameplay.
- Dark, late-night dashboard look (the app is forced to dark mode in `app.json`).
- Audio carries the game: every important event (signal peak, arrival) needs an audio cue, because PC players will have the game in the background.
- The layout must work on a phone in portrait and in a small desktop browser window.

## Working conventions

- Before calling a task done, run `npm run typecheck`, `npm run lint`, and `npm test`. Run `npx expo-doctor` after you change dependencies.
- Every rule in `src/game/` gets unit tests, especially the economy numbers (cargo loss per rebroadcast, fuel cost, Likes gain/loss).
- Every game design number lives in `src/gd/`, never inline in logic, content or components. Global numbers go in `src/gd/balance.ts` (Likes, pay ranges, fuel, trip times, cargo decay). Per-entity numbers go in `src/gd/world.ts`, keyed by the content id (place coordinates, cargo base pay, broadcaster odds and pay). They are open questions in GDD §11.
- When you resolve an open question from GDD §11, update the GDD too.
- Use the `@/` import alias for `src/`.
- No hardcoded string literals for enum-like values. Define an `as const` object (e.g. `TIP_TRUTH.Scam`) and build the type from it: `type X = (typeof X_CONST)[keyof typeof X_CONST]`. Discriminant tags on object unions (`Trip.kind`, `GameEvent.type`) stay as literals.

## Suggested build order (from GDD §12)

1. ~~`src/game/`: tip model, Go/Rebroadcast/Ignore resolution, fuel and cargo economy, with tests. Optionally a CLI or test-driven "paper prototype" sim.~~ **Done.**
2. ~~A minimal screen: list of tips, three buttons, money/Likes/fuel HUD.~~ **Done.** ("Scan the band" stands in for the dial; `__DEV__` buttons fast-forward time.)
3. Real-time travel + catch-up on resume + local notifications.
4. The tuning dial + signal meter (SVG + gestures), and reception quality that hides message fields.
5. The audio graph: static, band filters, crossfade into the signal.
6. Radio limits (battery, antenna, bands, time of day), gear shop, progression.
7. Characters and schedules.
8. Async multiplayer backend.
