import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { WORLD } from '@/content/world';
import {
  advance,
  createGame,
  createRng,
  generateTip,
  go,
  ignore,
  rebroadcast,
  refuel,
  takeLocalJob,
  type ActionError,
  type ActionResult,
  type GameEvent,
  type GameState,
  type TipId,
} from '@/game';

/** How many recent events the screen keeps. */
const LOG_SIZE = 20;

interface GameStore {
  /** `null` until `start()` runs on the client (keeps static web rendering deterministic). */
  game: GameState | null;
  /** Seed for tip generation. Each tip uses `seed + nextId`, so a saved game stays reproducible. */
  seed: number;
  /** Newest first. */
  log: GameEvent[];
  lastError: ActionError | null;
  /** Dev-only fast-forward. Added to the wall clock for every action. */
  clockOffsetMs: number;

  now: () => number;
  /** Load or create the game, then catch it up to now. */
  start: () => void;
  /** Catch up to now: resolve arrivals and settle Likes. */
  sync: () => void;
  /** Placeholder for the tuning dial (build order step 4): hear the next signal on the band. */
  scan: () => void;
  go: (tipId: TipId) => void;
  rebroadcast: (tipId: TipId) => void;
  ignore: (tipId: TipId) => void;
  fillUp: () => void;
  takeLocalJob: () => void;
  dismissError: () => void;
  devSkip: (ms: number) => void;
  devReset: () => void;
}

function newSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => {
      const withEvents = (events: GameEvent[]) => [...[...events].reverse(), ...get().log].slice(0, LOG_SIZE);

      /** Runs a pure game action against the current state and records its outcome. */
      const act = (fn: (game: GameState, now: number) => ActionResult) => {
        const { game, now } = get();
        if (!game) return;
        const result = fn(game, now());
        if (result.ok) set({ game: result.state, log: withEvents(result.events), lastError: null });
        else set({ lastError: result.reason });
      };

      return {
        game: null,
        seed: 0,
        log: [],
        lastError: null,
        clockOffsetMs: 0,

        now: () => Date.now() + get().clockOffsetMs,

        start: () => {
          if (!get().game) set({ game: createGame(WORLD, get().now()), seed: newSeed() });
          get().sync();
        },

        sync: () => {
          const { game, now } = get();
          if (!game) return;
          const { state, events } = advance(game, now());
          // Skip no-op updates so a ticking clock doesn't rewrite the save every second.
          if (events.length > 0) set({ game: state, log: withEvents(events) });
        },

        scan: () => {
          const { game, seed } = get();
          if (!game) return;
          const t = get().now();
          const { state, events } = advance(game, t);
          set({ game: generateTip(state, WORLD, createRng(seed + state.nextId), t), log: withEvents(events) });
        },

        go: (tipId) => act((g, t) => go(g, WORLD, tipId, t)),
        rebroadcast: (tipId) => act((g, t) => rebroadcast(g, tipId, t)),
        ignore: (tipId) => act((g, t) => ignore(g, tipId, t)),
        fillUp: () => act((g, t) => refuel(g, Infinity, t)),
        takeLocalJob: () => act((g, t) => takeLocalJob(g, t)),
        dismissError: () => set({ lastError: null }),

        devSkip: (ms) => {
          set({ clockOffsetMs: get().clockOffsetMs + ms });
          get().sync();
        },
        devReset: () => {
          set({ game: null, log: [], lastError: null, clockOffsetMs: 0 });
          get().start();
        },
      };
    },
    {
      name: 'radio-trucker/game',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      // Hydrate from the client only (see `useGameClock`), never during static web rendering.
      skipHydration: true,
      partialize: ({ game, seed, log, clockOffsetMs }) => ({ game, seed, log, clockOffsetMs }),
    },
  ),
);
