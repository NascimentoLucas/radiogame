import { NOTIFICATION_TEXT } from '@/content/notifications';
import { GAME_EVENT, getPlace, upcomingEventKey, type UpcomingEvent, type World } from '@/game';

/** A local notification to schedule, in wall-clock time. */
export interface PlannedNotification {
  id: string;
  /** Epoch ms on the device clock. */
  fireAt: number;
  title: string;
  body: string;
}

/**
 * Which upcoming events deserve a notification, and their text. Only arrivals (GDD §8). Likes settling stays
 * in-app so the phone doesn't buzz for every rebroadcast.
 *
 * `clockOffsetMs` is the dev fast-forward: game time = wall time + offset, so subtract it to get the real
 * fire time.
 */
export function planNotifications(
  upcoming: UpcomingEvent[],
  world: World,
  clockOffsetMs: number,
): PlannedNotification[] {
  const planned: PlannedNotification[] = [];
  for (const event of upcoming) {
    const fireAt = event.at - clockOffsetMs;
    const id = upcomingEventKey(event);
    if (event.type === GAME_EVENT.Arrived) {
      planned.push({ id, fireAt, ...NOTIFICATION_TEXT.arrived(getPlace(world, event.placeId).name) });
    } else if (event.type === GAME_EVENT.LocalJobDone) {
      planned.push({ id, fireAt, ...NOTIFICATION_TEXT.localJobDone });
    }
  }
  return planned;
}

/** Cheap equality check so the scheduler only touches the OS when the plan changes. */
export function planSignature(plan: PlannedNotification[]): string {
  return plan.map((n) => `${n.id}@${n.fireAt}`).join('|');
}
