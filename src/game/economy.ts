import { BALANCE } from './balance';
import type { GameState, Job, Place, PlaceId, TipId, World } from './types';

export function getPlace(world: World, id: PlaceId): Place {
  const place = world.places.find((p) => p.id === id);
  if (!place) throw new Error(`Unknown place: ${id}`);
  return place;
}

export function distanceKm(world: World, from: PlaceId, to: PlaceId): number {
  const a = getPlace(world, from);
  const b = getPlace(world, to);
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function fuelForDistance(km: number, litersPerKm: number): number {
  return km * litersPerKm;
}

export function fuelCost(liters: number): number {
  return liters * BALANCE.fuelPricePerLiter;
}

export function tripDurationMs(km: number): number {
  return Math.max(BALANCE.minTripMs, km * BALANCE.tripMsPerKm);
}

/** Units still available at a job at time `t`. NPC drivers take cargo continuously (exponential decay). */
export function cargoAt(job: Job, t: number): number {
  if (t <= job.unitsAsOf) return job.units;
  const halfLives = (t - job.unitsAsOf) / BALANCE.cargoHalfLifeMs;
  return job.units * Math.pow(0.5, halfLives);
}

/** A rebroadcast sharply cuts the cargo left at the job. */
export function applyRebroadcastToJob(job: Job, now: number): Job {
  return { ...job, units: cargoAt(job, now) * BALANCE.rebroadcastCargoKeep, unitsAsOf: now };
}

export function unitsLoadable(job: Job | null, t: number, cargoCapacity: number): number {
  if (!job) return 0;
  return Math.min(Math.floor(cargoAt(job, t)), cargoCapacity);
}

export interface TripEstimate {
  distanceKm: number;
  fuelLiters: number;
  fuelCost: number;
  durationMs: number;
  /** Based on what the broadcast *claims*, capped by truck capacity. Never peeks at the hidden job. */
  claimedPayout: number;
  claimedProfit: number;
}

/** What the player can work out from the broadcast alone. Safe to show in UI. */
export function estimateTrip(state: GameState, world: World, tipId: TipId): TripEstimate {
  const tip = state.tips.find((t) => t.id === tipId);
  if (!tip) throw new Error(`Unknown tip: ${tipId}`);
  const km = distanceKm(world, state.locationId, tip.broadcast.placeId);
  const liters = fuelForDistance(km, state.truck.litersPerKm);
  const units = Math.min(tip.broadcast.units, state.truck.cargoCapacity);
  const claimedPayout = units * tip.broadcast.payPerUnit;
  return {
    distanceKm: km,
    fuelLiters: liters,
    fuelCost: fuelCost(liters),
    durationMs: tripDurationMs(km),
    claimedPayout,
    claimedProfit: claimedPayout - fuelCost(liters),
  };
}
