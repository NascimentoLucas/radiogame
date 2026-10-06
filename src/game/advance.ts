import { cargoAt, unitsLoadable } from './economy';
import type { GameEvent, GameState } from './types';

export interface AdvanceResult {
  state: GameState;
  events: GameEvent[];
}

/**
 * Catch the simulation up to `now`: resolve trip arrivals and settle pending Likes, in chronological order.
 * Safe to call with any `now`; a `now` earlier than the last update (clock skew) changes nothing.
 */
export function advance(state: GameState, now: number): AdvanceResult {
  const target = Math.max(now, state.lastUpdatedAt);
  const events: GameEvent[] = [];
  let s = state;

  for (;;) {
    const tripAt = s.trip && s.trip.arriveAt <= target ? s.trip.arriveAt : Infinity;
    const likes = s.pendingLikes.filter((p) => p.settlesAt <= target);
    const likesAt = likes.length > 0 ? Math.min(...likes.map((p) => p.settlesAt)) : Infinity;
    if (tripAt === Infinity && likesAt === Infinity) break;

    if (tripAt <= likesAt) {
      const r = resolveTrip(s);
      s = r.state;
      events.push(r.event);
    } else {
      const due = s.pendingLikes.find((p) => p.settlesAt === likesAt)!;
      s = {
        ...s,
        likes: Math.max(0, s.likes + due.delta),
        pendingLikes: s.pendingLikes.filter((p) => p !== due),
      };
      events.push({ type: 'likes-settled', tipId: due.tipId, delta: due.delta, at: due.settlesAt });
    }
  }

  return { state: { ...s, lastUpdatedAt: target }, events };
}

function resolveTrip(s: GameState): { state: GameState; event: GameEvent } {
  const trip = s.trip!;
  if (trip.kind === 'local') {
    return {
      state: { ...s, trip: null, money: s.money + trip.pay },
      event: { type: 'local-job-done', pay: trip.pay, at: trip.arriveAt },
    };
  }

  const tip = s.tips.find((t) => t.id === trip.tipId)!;
  const job = tip.jobId ? s.jobs[tip.jobId] ?? null : null;
  const units = unitsLoadable(job, trip.arriveAt, s.truck.cargoCapacity);
  const payout = job ? units * job.payPerUnit : 0;
  const jobs = { ...s.jobs };
  if (job) {
    jobs[job.id] = {
      ...job,
      units: Math.max(0, cargoAt(job, trip.arriveAt) - units),
      unitsAsOf: trip.arriveAt,
    };
  }

  return {
    state: { ...s, trip: null, money: s.money + payout, locationId: trip.toPlaceId, jobs },
    event: {
      type: 'arrived',
      tipId: tip.id,
      placeId: trip.toPlaceId,
      unitsLoaded: units,
      payout,
      at: trip.arriveAt,
    },
  };
}
