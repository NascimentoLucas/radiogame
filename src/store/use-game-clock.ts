import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { dismissDeliveredNotifications } from '@/notifications/scheduler';

import { useGameStore } from './game-store';

const TICK_MS = 1000;

/**
 * Loads the saved game once, then ticks: catches the sim up to now and returns the current game time
 * for countdowns. Returns `null` until the game is ready.
 *
 * Timers don't run while the app is in the background, so coming back to the foreground catches up at once
 * (everything that happened while away lands in the log) instead of waiting for the next tick.
 */
export function useGameClock(): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    let ready = false;
    let cancelled = false;
    const tick = () => {
      const store = useGameStore.getState();
      store.sync();
      setNow(store.now());
    };

    Promise.resolve(useGameStore.persist.rehydrate()).then(() => {
      if (cancelled) return;
      useGameStore.getState().start();
      ready = true;
      tick();
      void dismissDeliveredNotifications();
      timer = setInterval(tick, TICK_MS);
    });

    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !ready) return;
      tick();
      void dismissDeliveredNotifications();
    });

    return () => {
      cancelled = true;
      clearInterval(timer);
      subscription.remove();
    };
  }, []);

  return now;
}
