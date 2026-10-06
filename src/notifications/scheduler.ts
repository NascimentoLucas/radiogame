import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { NOTIFICATION_TEXT } from '@/content/notifications';

import { planSignature, type PlannedNotification } from './plan';

const CHANNEL_ID = 'road';

let configured = false;
let askedThisSession = false;
let lastSignature = '';
/** Serializes OS calls so two quick plan changes can't interleave cancel/schedule. */
let queue: Promise<void> = Promise.resolve();

/** Call once at startup. The app shows its own log while open, so alerts stay silent in the foreground. */
export function configureNotifications(): void {
  if (configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    queue = queue.then(() =>
      Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: NOTIFICATION_TEXT.channelName,
        importance: Notifications.AndroidImportance.DEFAULT,
      }).then(() => undefined),
    );
  }
}

/**
 * Asks for permission the first time there is something to notify about (a trip starts), never on launch.
 * Asks at most once per session; the OS remembers a refusal.
 */
async function hasPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain || askedThisSession) return false;
  askedThisSession = true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** Make the OS schedule match `plan`: cancel what's stale and schedule what's new. No-op if nothing changed. */
export function scheduleNotifications(plan: PlannedNotification[]): Promise<void> {
  const signature = planSignature(plan);
  if (signature === lastSignature) return queue;
  lastSignature = signature;

  queue = queue
    .then(async () => {
      await Notifications.cancelAllScheduledNotificationsAsync();
      const due = plan.filter((n) => n.fireAt > Date.now());
      if (due.length === 0 || !(await hasPermission())) return;
      for (const n of due) {
        await Notifications.scheduleNotificationAsync({
          identifier: n.id,
          content: { title: n.title, body: n.body },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.fireAt, channelId: CHANNEL_ID },
        });
      }
    })
    .catch((e: unknown) => {
      // Notifications are optional (GDD §8): never let them break the game. Retry on the next change.
      lastSignature = '';
      console.warn('Could not schedule notifications', e);
    });
  return queue;
}

/** Clear alerts already in the tray: the player is looking at the game now. */
export function dismissDeliveredNotifications(): Promise<void> {
  return Notifications.dismissAllNotificationsAsync().catch(() => undefined);
}

/** Test-only: forget module state between tests. */
export function resetNotificationsForTests(): void {
  configured = false;
  askedThisSession = false;
  lastSignature = '';
  queue = Promise.resolve();
}
