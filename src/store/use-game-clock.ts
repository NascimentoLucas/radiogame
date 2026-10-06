import { useEffect, useState } from 'react';

import { useGameStore } from './game-store';

const TICK_MS = 1000;

/**
 * Loads the saved game once, then ticks: catches the sim up to now and returns the current game time
 * for countdowns. Returns `null` until the game is ready.
 */
export function useGameClock(): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    let cancelled = false;
    const tick = () => {
      const store = useGameStore.getState();
      store.sync();
      setNow(store.now());
    };

    Promise.resolve(useGameStore.persist.rehydrate()).then(() => {
      if (cancelled) return;
      useGameStore.getState().start();
      tick();
      timer = setInterval(tick, TICK_MS);
    });

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return now;
}
