/**
 * expo-notifications doesn't support web. On PC the game relies on audio cues instead (GDD §8, build order
 * step 5). Same API as ./scheduler.ts, all no-ops.
 */
import type { PlannedNotification } from './plan';

export function configureNotifications(): void {}

export function scheduleNotifications(_plan: PlannedNotification[]): Promise<void> {
  return Promise.resolve();
}

export function dismissDeliveredNotifications(): Promise<void> {
  return Promise.resolve();
}

export function resetNotificationsForTests(): void {}
