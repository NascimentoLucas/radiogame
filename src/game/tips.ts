import { BALANCE } from '@/gd';
import type { Rng } from './rng';
import { TIP_STATUS, TIP_TRUTH, type Broadcast, type GameState, type Job, type PhraseId, type Tip, type TipTruth, type World } from './types';

function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new Error('pick() from empty list');
  return items[Math.floor(rng() * items.length)];
}

function pickWeighted<K extends string>(rng: Rng, weights: Record<K, number>): K {
  const entries = Object.entries(weights) as [K, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (const [key, w] of entries) {
    roll -= w;
    if (roll < 0) return key;
  }
  return entries[entries.length - 1][0];
}

function between(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}

function intBetween(rng: Rng, min: number, max: number): number {
  return Math.floor(between(rng, min, max + 1));
}

function pickPhrases(rng: Rng, world: World, truth: TipTruth): PhraseId[] {
  const neutral = world.phrases.filter((p) => p.hintsAt === null);
  const tells = world.phrases.filter((p) => p.hintsAt === truth);
  const phrases: PhraseId[] = [pick(rng, neutral).id];
  if (truth !== TIP_TRUTH.Good && tells.length > 0 && rng() < BALANCE.tellChance) {
    phrases.push(pick(rng, tells).id);
  }
  return phrases;
}

/**
 * A new tip is heard on the radio. Creates the broadcast (the claim) and, unless it's a scam,
 * the hidden job it's about. Deterministic for a given rng.
 */
export function generateTip(state: GameState, world: World, rng: Rng, now: number): GameState {
  const broadcaster = pick(rng, world.broadcasters);
  const destinations = world.places.filter((p) => p.id !== state.locationId);
  const place = pick(rng, destinations);
  const cargo = pick(rng, world.cargoKinds);
  const truth = pickWeighted(rng, broadcaster.truthWeights);

  const realUnits = intBetween(rng, BALANCE.jobUnitsMin, BALANCE.jobUnitsMax);
  const jitter = between(rng, 1 - BALANCE.payJitter, 1 + BALANCE.payJitter);
  const realPay = Math.round(cargo.basePayPerUnit * broadcaster.payMultiplier * jitter);

  let claimUnits = realUnits;
  let claimPay = realPay;
  let jobUnits = realUnits;
  let hasJob = true;

  switch (truth) {
    case TIP_TRUTH.Good:
      break;
    case TIP_TRUTH.Exaggerated: {
      const mult = between(rng, BALANCE.exaggerationMin, BALANCE.exaggerationMax);
      claimUnits = Math.round(realUnits * mult);
      claimPay = Math.round(realPay * mult);
      break;
    }
    case TIP_TRUTH.Outdated:
      jobUnits = realUnits * rng() * BALANCE.outdatedKeepMax;
      break;
    case TIP_TRUTH.Scam:
      claimPay = Math.round(cargo.basePayPerUnit * BALANCE.scamPayMultiplier);
      hasJob = false;
      break;
  }

  const id = state.nextId;
  const tipId = `t${id}`;
  const jobId = `j${id}`;
  const broadcast: Broadcast = {
    placeId: place.id,
    cargoKindId: cargo.id,
    units: claimUnits,
    payPerUnit: claimPay,
    phrases: pickPhrases(rng, world, truth),
  };
  const tip: Tip = {
    id: tipId,
    broadcast,
    broadcasterId: broadcaster.id,
    heardAt: now,
    truth,
    jobId: hasJob ? jobId : null,
    status: TIP_STATUS.Open,
    rebroadcastAt: null,
  };
  const jobs = { ...state.jobs };
  if (hasJob) {
    const job: Job = {
      id: jobId,
      placeId: place.id,
      cargoKindId: cargo.id,
      payPerUnit: realPay,
      units: jobUnits,
      unitsAsOf: now,
    };
    jobs[jobId] = job;
  }

  return { ...state, tips: [...state.tips, tip], jobs, nextId: id + 1 };
}
