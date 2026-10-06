import { GAME_EVENT, TRIP_KIND, type GameState, type PlaceId, type TipId } from './types';

/**
 * Something `advance()` will resolve later, if nothing else happens first. Carries no outcome (payout, units,
 * reactions): those stay hidden until the event actually resolves. Used to schedule notifications.
 */
export type UpcomingEvent =
  | { type: typeof GAME_EVENT.Arrived; tipId: TipId; placeId: PlaceId; at: number }
  | { type: typeof GAME_EVENT.LocalJobDone; at: number }
  | { type: typeof GAME_EVENT.LikesSettled; tipId: TipId; at: number };

/** Upcoming events after `state.lastUpdatedAt`, soonest first. */
export function upcomingEvents(state: GameState): UpcomingEvent[] {
  const events: UpcomingEvent[] = [];
  const { trip } = state;
  if (trip?.kind === TRIP_KIND.Tip) {
    events.push({ type: GAME_EVENT.Arrived, tipId: trip.tipId, placeId: trip.toPlaceId, at: trip.arriveAt });
  } else if (trip?.kind === TRIP_KIND.Local) {
    events.push({ type: GAME_EVENT.LocalJobDone, at: trip.arriveAt });
  }
  for (const p of state.pendingLikes) events.push({ type: GAME_EVENT.LikesSettled, tipId: p.tipId, at: p.settlesAt });
  return events.filter((e) => e.at > state.lastUpdatedAt).sort((a, b) => a.at - b.at);
}

/** A stable id for an upcoming event, so a scheduler can tell whether anything changed. */
export function upcomingEventKey(event: UpcomingEvent): string {
  return event.type === GAME_EVENT.LocalJobDone ? `${event.type}:${event.at}` : `${event.type}:${event.tipId}`;
}
