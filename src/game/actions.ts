import { advance } from './advance';
import { BALANCE } from '@/gd';
import { applyRebroadcastToJob, distanceKm, fuelForDistance, tripDurationMs } from './economy';
import { ACTION_ERROR, TIP_STATUS, TRIP_KIND, type ActionResult, type GameState, type Tip, type TipId, type World } from './types';

export function createGame(world: World, now: number): GameState {
  return {
    money: BALANCE.startMoney,
    likes: BALANCE.startLikes,
    fuel: BALANCE.startFuel,
    truck: { ...BALANCE.startTruck },
    locationId: world.homePlaceId,
    tips: [],
    jobs: {},
    trip: null,
    pendingLikes: [],
    nextId: 1,
    lastUpdatedAt: now,
  };
}

function updateTip(state: GameState, tipId: TipId, patch: Partial<Tip>): GameState {
  return { ...state, tips: state.tips.map((t) => (t.id === tipId ? { ...t, ...patch } : t)) };
}

/** Every action first catches the world up to `now`, so actions and arrivals stay in order. */
type Failure = Extract<ActionResult, { ok: false }>;

function withAdvance(state: GameState, now: number, act: (s: GameState, t: number) => GameState | Failure): ActionResult {
  const { state: advanced, events } = advance(state, now);
  const result = act(advanced, advanced.lastUpdatedAt);
  if ('ok' in result) return result;
  return { ok: true, state: result, events };
}

/** GO: drive to the tip's location. Fuel is spent at departure; cargo is loaded and paid on arrival. */
export function go(state: GameState, world: World, tipId: TipId, now: number): ActionResult {
  return withAdvance(state, now, (s, t) => {
    const tip = s.tips.find((t) => t.id === tipId);
    if (!tip) return { ok: false, reason: ACTION_ERROR.UnknownTip };
    if (s.trip) return { ok: false, reason: ACTION_ERROR.OnTrip };
    if (tip.status !== TIP_STATUS.Open) return { ok: false, reason: ACTION_ERROR.TipNotOpen };

    const km = distanceKm(world, s.locationId, tip.broadcast.placeId);
    const liters = fuelForDistance(km, s.truck.litersPerKm);
    if (liters > s.fuel) return { ok: false, reason: ACTION_ERROR.NotEnoughFuel };

    const next = updateTip(s, tipId, { status: TIP_STATUS.Taken });
    return {
      ...next,
      fuel: s.fuel - liters,
      trip: {
        kind: TRIP_KIND.Tip,
        tipId,
        fromPlaceId: s.locationId,
        toPlaceId: tip.broadcast.placeId,
        departAt: t,
        arriveAt: t + tripDurationMs(km),
      },
    };
  });
}

/**
 * REBROADCAST: share the tip. Cargo at the job drops sharply right away; the tip's pool of likes and
 * unlikes settles later (mostly likes for a good tip, mostly unlikes for a bad one). The player only
 * ever gains Likes from it. The tip stays open, so you can still Go to a smaller load.
 * Works while driving (it's a radio).
 */
export function rebroadcast(state: GameState, tipId: TipId, now: number): ActionResult {
  return withAdvance(state, now, (s, t) => {
    const tip = s.tips.find((t) => t.id === tipId);
    if (!tip) return { ok: false, reason: ACTION_ERROR.UnknownTip };
    if (tip.status !== TIP_STATUS.Open || tip.rebroadcastAt !== null) return { ok: false, reason: ACTION_ERROR.TipNotOpen };

    const jobs = { ...s.jobs };
    const job = tip.jobId ? jobs[tip.jobId] : undefined;
    if (job) jobs[job.id] = applyRebroadcastToJob(job, t);

    const { likes, unlikes } = BALANCE.rebroadcastReactions[tip.truth];
    const next = updateTip(s, tipId, { rebroadcastAt: t });
    return {
      ...next,
      jobs,
      pendingLikes: [...s.pendingLikes, { tipId, likes, unlikes, settlesAt: t + BALANCE.likesSettleDelayMs }],
    };
  });
}

/** IGNORE: let it pass. No gain, no cost. */
export function ignore(state: GameState, tipId: TipId, now: number): ActionResult {
  return withAdvance(state, now, (s) => {
    const tip = s.tips.find((t) => t.id === tipId);
    if (!tip) return { ok: false, reason: ACTION_ERROR.UnknownTip };
    if (tip.status !== TIP_STATUS.Open) return { ok: false, reason: ACTION_ERROR.TipNotOpen };
    return updateTip(s, tipId, { status: TIP_STATUS.Ignored });
  });
}

/** Buy fuel. Buys as much as possible up to `liters`, limited by tank space and money. */
export function refuel(state: GameState, liters: number, now: number): ActionResult {
  return withAdvance(state, now, (s) => {
    if (s.trip) return { ok: false, reason: ACTION_ERROR.OnTrip };
    const affordable = s.money / BALANCE.fuelPricePerLiter;
    const amount = Math.max(0, Math.min(liters, s.truck.fuelCapacity - s.fuel, affordable));
    if (amount <= 0) return { ok: false, reason: ACTION_ERROR.NothingToRefuel };
    return { ...s, fuel: s.fuel + amount, money: s.money - amount * BALANCE.fuelPricePerLiter };
  });
}

/**
 * Local dispatcher run: always available, needs no fuel and no money, pays a little.
 * This is the guarantee that there is no fail state (GDD §6).
 */
export function takeLocalJob(state: GameState, now: number): ActionResult {
  return withAdvance(state, now, (s, t) => {
    if (s.trip) return { ok: false, reason: ACTION_ERROR.OnTrip };
    return {
      ...s,
      trip: { kind: TRIP_KIND.Local, pay: BALANCE.localJobPay, departAt: t, arriveAt: t + BALANCE.localJobDurationMs },
    };
  });
}
