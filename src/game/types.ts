/** Core simulation types and their string constants. Pure data: no React, no RN. */

export type PlaceId = string;
export type CargoKindId = string;
export type BroadcasterId = string;
export type PhraseId = string;
export type TipId = string;
export type JobId = string;

/** A point on the stylized map. Coordinates are in km. */
export interface Place {
  id: PlaceId;
  name: string;
  x: number;
  y: number;
}

export interface CargoKind {
  id: CargoKindId;
  name: string;
  basePayPerUnit: number;
}

/** What is actually true about a tip. Hidden from the player. */
export const TIP_TRUTH = {
  Good: 'good',
  Outdated: 'outdated',
  Exaggerated: 'exaggerated',
  Scam: 'scam',
} as const;

export type TipTruth = (typeof TIP_TRUTH)[keyof typeof TIP_TRUTH];

export interface Phrase {
  id: PhraseId;
  text: string;
  /** If set, this phrase is a "tell": it tends to show up on tips with this truth. */
  hintsAt: TipTruth | null;
}

export interface Broadcaster {
  id: BroadcasterId;
  name: string;
  /** How reliable the player believes this voice to be (0..1). Shown in UI; not the real odds. */
  perceivedReliability: number;
  /** Relative weights for the hidden truth of this broadcaster's tips. */
  truthWeights: Record<TipTruth, number>;
  /** Multiplier on cargo base pay for this broadcaster's jobs (dispatcher pays low, etc.). */
  payMultiplier: number;
}

/** Everything static the simulation needs. Built from src/content. */
export interface World {
  places: Place[];
  cargoKinds: CargoKind[];
  broadcasters: Broadcaster[];
  phrases: Phrase[];
  /** Where a new game starts. */
  homePlaceId: PlaceId;
}

/**
 * The structured message heard on the radio (GDD §9). This is a *claim*: it may not match the job.
 * Never free text, so the same type works for real-player broadcasts later.
 */
export interface Broadcast {
  placeId: PlaceId;
  cargoKindId: CargoKindId;
  units: number;
  payPerUnit: number;
  phrases: PhraseId[];
}

/** The real cargo waiting at a place. Units decay over time as NPC drivers take it. */
export interface Job {
  id: JobId;
  placeId: PlaceId;
  cargoKindId: CargoKindId;
  payPerUnit: number;
  /** Units available as of `unitsAsOf`. Use `cargoAt()` to read the current amount. */
  units: number;
  unitsAsOf: number;
}

export const TIP_STATUS = {
  Open: 'open',
  Ignored: 'ignored',
  Taken: 'taken',
} as const;

export type TipStatus = (typeof TIP_STATUS)[keyof typeof TIP_STATUS];

export interface Tip {
  id: TipId;
  broadcast: Broadcast;
  broadcasterId: BroadcasterId;
  heardAt: number;
  /** Hidden. */
  truth: TipTruth;
  /** Hidden. `null` for scams: there is no job. */
  jobId: JobId | null;
  status: TipStatus;
  rebroadcastAt: number | null;
}

export interface TruckStats {
  fuelCapacity: number;
  cargoCapacity: number;
  litersPerKm: number;
}

export const TRIP_KIND = {
  Tip: 'tip',
  Local: 'local',
} as const;

export type TripKind = (typeof TRIP_KIND)[keyof typeof TRIP_KIND];

export type Trip =
  | {
      kind: typeof TRIP_KIND.Tip;
      tipId: TipId;
      fromPlaceId: PlaceId;
      toPlaceId: PlaceId;
      departAt: number;
      arriveAt: number;
    }
  | {
      kind: typeof TRIP_KIND.Local;
      pay: number;
      departAt: number;
      arriveAt: number;
    };

/**
 * A rebroadcast's pool of reactions. It settles later, once other drivers have checked the tip out.
 * The player gains `likes - unlikes` if that is positive; a rebroadcast never removes Likes.
 */
export interface PendingLikes {
  tipId: TipId;
  likes: number;
  unlikes: number;
  settlesAt: number;
}

export interface GameState {
  money: number;
  likes: number;
  fuel: number;
  truck: TruckStats;
  locationId: PlaceId;
  tips: Tip[];
  jobs: Record<JobId, Job>;
  trip: Trip | null;
  pendingLikes: PendingLikes[];
  nextId: number;
  /** Epoch ms of the last time the state was advanced. */
  lastUpdatedAt: number;
}

export const GAME_EVENT = {
  Arrived: 'arrived',
  LocalJobDone: 'local-job-done',
  LikesSettled: 'likes-settled',
} as const;

export type GameEventType = (typeof GAME_EVENT)[keyof typeof GAME_EVENT];

/** Things that happened during `advance()`. Used later for notifications and audio cues. */
export type GameEvent =
  | { type: typeof GAME_EVENT.Arrived; tipId: TipId; placeId: PlaceId; unitsLoaded: number; payout: number; at: number }
  | { type: typeof GAME_EVENT.LocalJobDone; pay: number; at: number }
  | { type: typeof GAME_EVENT.LikesSettled; tipId: TipId; likes: number; unlikes: number; gain: number; at: number };

export const ACTION_ERROR = {
  UnknownTip: 'unknown-tip',
  TipNotOpen: 'tip-not-open',
  OnTrip: 'on-trip',
  NotEnoughFuel: 'not-enough-fuel',
  NothingToRefuel: 'nothing-to-refuel',
} as const;

export type ActionError = (typeof ACTION_ERROR)[keyof typeof ACTION_ERROR];

export type ActionResult =
  | { ok: true; state: GameState; events: GameEvent[] }
  | { ok: false; reason: ActionError };
