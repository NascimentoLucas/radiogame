import { useEffect } from 'react';

import { WORLD } from '@/content/world';
import { upcomingEvents } from '@/game';
import { useGameStore } from '@/store/game-store';

import { planNotifications } from './plan';
import { configureNotifications, scheduleNotifications } from './scheduler';

/** Keeps the OS's scheduled notifications in step with the game: reschedules whenever a trip starts or ends. */
export function useNotificationSync(): void {
  useEffect(() => {
    configureNotifications();
    const sync = () => {
      const { game, clockOffsetMs } = useGameStore.getState();
      if (!game) return;
      void scheduleNotifications(planNotifications(upcomingEvents(game), WORLD, clockOffsetMs));
    };
    sync();
    return useGameStore.subscribe((state, prev) => {
      if (state.game?.trip !== prev.game?.trip || state.clockOffsetMs !== prev.clockOffsetMs) sync();
    });
  }, []);
}
