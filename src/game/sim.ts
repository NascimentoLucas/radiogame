/**
 * "Paper prototype" (GDD §12): play many tips with a fixed strategy and compare outcomes.
 * Used by tests to check that the Go / Rebroadcast / Ignore dilemma holds under the current balance.
 */
import { go, createGame, rebroadcast, refuel, takeLocalJob } from './actions';
import { advance } from './advance';
import { BALANCE } from '@/gd';
import { estimateTrip, type TripEstimate } from './economy';
import { createRng } from './rng';
import { generateTip } from './tips';
import { ACTION_ERROR, type Broadcaster, type GameState, type Tip, type World } from './types';

export const DECISION = {
  Go: 'go',
  Rebroadcast: 'rebroadcast',
  RebroadcastThenGo: 'rebroadcast-then-go',
  Ignore: 'ignore',
} as const;

export type Decision = (typeof DECISION)[keyof typeof DECISION];

/** What the player can perceive about a tip. Strategies must not look at hidden fields. */
export interface TipView {
  tip: Pick<Tip, 'id' | 'broadcast' | 'broadcasterId'>;
  broadcaster: Broadcaster;
  estimate: TripEstimate;
  world: World;
}

export type Strategy = (view: TipView) => Decision;

export const STRATEGY = {
  IgnoreAll: 'ignoreAll',
  GoAll: 'goAll',
  RebroadcastAll: 'rebroadcastAll',
  RebroadcastThenGo: 'rebroadcastThenGo',
  Careful: 'careful',
} as const;

export type StrategyName = (typeof STRATEGY)[keyof typeof STRATEGY];

export const STRATEGIES: Record<StrategyName, Strategy> = {
  [STRATEGY.IgnoreAll]: () => DECISION.Ignore,
  [STRATEGY.GoAll]: () => DECISION.Go,
  [STRATEGY.RebroadcastAll]: () => DECISION.Rebroadcast,
  [STRATEGY.RebroadcastThenGo]: () => DECISION.RebroadcastThenGo,
  /** Listens for tells, trusts reliable voices, only drives when the claim looks profitable. */
  [STRATEGY.Careful]: ({ tip, broadcaster, estimate, world }) => {
    const hasTell = tip.broadcast.phrases.some((id) => world.phrases.find((p) => p.id === id)?.hintsAt);
    if (hasTell || broadcaster.perceivedReliability < 0.5) return DECISION.Ignore;
    if (estimate.claimedProfit > 60) return DECISION.Go;
    return DECISION.Rebroadcast;
  },
};

export interface SimOptions {
  world: World;
  strategy: Strategy;
  seed: number;
  tipCount: number;
  startAt?: number;
  /** Real time between tips heard. */
  gapMs?: number;
}

export interface SimResult {
  state: GameState;
  money: number;
  likes: number;
  /** Money plus the value of fuel in the tank. */
  netWorth: number;
  trips: number;
  rebroadcasts: number;
  localJobs: number;
  totalPayout: number;
}

export function runSim({ world, strategy, seed, tipCount, startAt = 0, gapMs = 5 * 60_000 }: SimOptions): SimResult {
  const rng = createRng(seed);
  let t = startAt;
  let state = createGame(world, t);
  let trips = 0;
  let rebroadcasts = 0;
  let localJobs = 0;
  let totalPayout = 0;

  const settle = (until: number) => {
    const r = advance(state, until);
    state = r.state;
    for (const e of r.events) if (e.type === 'arrived') totalPayout += e.payout;
  };

  for (let i = 0; i < tipCount; i++) {
    state = generateTip(state, world, rng, t);
    const tip = state.tips[state.tips.length - 1];
    const broadcaster = world.broadcasters.find((b) => b.id === tip.broadcasterId)!;
    const decision = strategy({ tip, broadcaster, estimate: estimateTrip(state, world, tip.id), world });

    if (decision === DECISION.Rebroadcast || decision === DECISION.RebroadcastThenGo) {
      const r = rebroadcast(state, tip.id, t);
      if (r.ok) {
        state = r.state;
        rebroadcasts++;
      }
    }

    if (decision === DECISION.Go || decision === DECISION.RebroadcastThenGo) {
      let r = go(state, world, tip.id, t);
      if (!r.ok && r.reason === ACTION_ERROR.NotEnoughFuel) {
        const fuelled = refuel(state, Infinity, t);
        if (fuelled.ok) state = fuelled.state;
        r = go(state, world, tip.id, t);
      }
      if (r.ok) {
        state = r.state;
        trips++;
      } else {
        // Broke and out of fuel: the dispatcher always has a local run.
        const local = takeLocalJob(state, t);
        if (local.ok) {
          state = local.state;
          localJobs++;
        }
      }
      if (state.trip) {
        t = state.trip.arriveAt;
        settle(t);
      }
    }

    t += gapMs;
  }

  settle(t + BALANCE.likesSettleDelayMs);
  return {
    state,
    money: state.money,
    likes: state.likes,
    netWorth: state.money + state.fuel * BALANCE.fuelPricePerLiter,
    trips,
    rebroadcasts,
    localJobs,
    totalPayout,
  };
}
