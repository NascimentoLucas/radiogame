/**
 * Per-entity tuning numbers for the world, keyed by the ids used in src/content/world.ts.
 * Names and text stay in content; everything here changes how the game plays.
 */
import { TIP_TRUTH, type Broadcaster, type CargoKind, type Place } from '@/game/types';

/**
 * Map coordinates in km. Distance drives fuel cost and trip time, so moving a place changes
 * how profitable its jobs are.
 */
export const PLACE_COORDS = {
  'truck-stop': { x: 0, y: 0 },
  'mill-town': { x: 40, y: 15 },
  'river-port': { x: -70, y: 30 },
  'orchard-valley': { x: 25, y: -90 },
  quarry: { x: 120, y: 60 },
  'border-depot': { x: -150, y: -110 },
} as const satisfies Record<string, Pick<Place, 'x' | 'y'>>;

/** Base pay per unit for each cargo kind, before the broadcaster's multiplier and jitter. */
export const CARGO_PAY = {
  general: { basePayPerUnit: 8 },
  produce: { basePayPerUnit: 10 },
  lumber: { basePayPerUnit: 12 },
} as const satisfies Record<string, Pick<CargoKind, 'basePayPerUnit'>>;

type BroadcasterTuning = Pick<Broadcaster, 'perceivedReliability' | 'truthWeights' | 'payMultiplier'>;

/** How trustworthy each voice really is (truth weights), how trustworthy it looks, and how well it pays. */
export const BROADCASTER_TUNING = {
  dispatcher: {
    perceivedReliability: 0.9,
    truthWeights: { [TIP_TRUTH.Good]: 9, [TIP_TRUTH.Outdated]: 1, [TIP_TRUTH.Exaggerated]: 0, [TIP_TRUTH.Scam]: 0 },
    payMultiplier: 0.8,
  },
  waitress: {
    perceivedReliability: 0.75,
    truthWeights: { [TIP_TRUTH.Good]: 6, [TIP_TRUTH.Outdated]: 3, [TIP_TRUTH.Exaggerated]: 1, [TIP_TRUTH.Scam]: 0 },
    payMultiplier: 1,
  },
  rival: {
    perceivedReliability: 0.5,
    truthWeights: { [TIP_TRUTH.Good]: 4, [TIP_TRUTH.Outdated]: 2, [TIP_TRUTH.Exaggerated]: 4, [TIP_TRUTH.Scam]: 0 },
    payMultiplier: 1.1,
  },
  scammer: {
    perceivedReliability: 0.3,
    truthWeights: { [TIP_TRUTH.Good]: 1, [TIP_TRUTH.Outdated]: 0, [TIP_TRUTH.Exaggerated]: 2, [TIP_TRUTH.Scam]: 7 },
    payMultiplier: 1,
  },
} as const satisfies Record<string, BroadcasterTuning>;
