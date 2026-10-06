/** Small, hand-checkable world and helpers for unit tests. */
import { createGame } from './actions';
import { TIP_STATUS, TIP_TRUTH, type GameState, type Tip, type TipTruth, type World } from './types';

/** Home and a single destination exactly 100 km away. */
export const TEST_WORLD: World = {
  places: [
    { id: 'home', name: 'Home', x: 0, y: 0 },
    { id: 'far', name: 'Far', x: 60, y: 80 },
  ],
  cargoKinds: [{ id: 'box', name: 'Boxes', basePayPerUnit: 10 }],
  broadcasters: [
    {
      id: 'voice',
      name: 'A Voice',
      perceivedReliability: 0.8,
      truthWeights: { [TIP_TRUTH.Good]: 1, [TIP_TRUTH.Outdated]: 1, [TIP_TRUTH.Exaggerated]: 1, [TIP_TRUTH.Scam]: 1 },
      payMultiplier: 1,
    },
  ],
  phrases: [
    { id: 'neutral', text: 'Hello.', hintsAt: null },
    { id: 'old', text: 'Old news.', hintsAt: TIP_TRUTH.Outdated },
    { id: 'big', text: 'Huge!', hintsAt: TIP_TRUTH.Exaggerated },
    { id: 'scam', text: 'Free money!', hintsAt: TIP_TRUTH.Scam },
  ],
  homePlaceId: 'home',
};

export const T0 = 1_700_000_000_000;

export function newGame(): GameState {
  return createGame(TEST_WORLD, T0);
}

interface TipSpec {
  truth?: TipTruth;
  /** Claimed. */
  units?: number;
  payPerUnit?: number;
  /** Real units at the job. Defaults to the claim. Ignored for scams. */
  jobUnits?: number;
  at?: number;
}

/** Adds a tip to `far` with full control over the claim and the hidden job. */
export function withTip(state: GameState, spec: TipSpec = {}): { state: GameState; tipId: string } {
  const { truth = TIP_TRUTH.Good, units = 20, payPerUnit = 10, jobUnits = units, at = T0 } = spec;
  const id = state.nextId;
  const tipId = `t${id}`;
  const jobId = `j${id}`;
  const hasJob = truth !== TIP_TRUTH.Scam;
  const tip: Tip = {
    id: tipId,
    broadcast: { placeId: 'far', cargoKindId: 'box', units, payPerUnit, phrases: ['neutral'] },
    broadcasterId: 'voice',
    heardAt: at,
    truth,
    jobId: hasJob ? jobId : null,
    status: TIP_STATUS.Open,
    rebroadcastAt: null,
  };
  const jobs = hasJob
    ? {
        ...state.jobs,
        [jobId]: { id: jobId, placeId: 'far', cargoKindId: 'box', payPerUnit, units: jobUnits, unitsAsOf: at },
      }
    : state.jobs;
  return { state: { ...state, tips: [...state.tips, tip], jobs, nextId: id + 1 }, tipId };
}

export function unwrap<T extends { ok: boolean }>(r: T): Extract<T, { ok: true }> {
  if (!r.ok) throw new Error(`Action failed: ${JSON.stringify(r)}`);
  return r as Extract<T, { ok: true }>;
}
