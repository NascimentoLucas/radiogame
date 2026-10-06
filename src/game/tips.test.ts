import { WORLD } from '@/content/world';

import { createGame } from './actions';
import { BALANCE } from '@/gd';
import { createRng } from './rng';
import { generateTip } from './tips';
import { TIP_TRUTH, type GameState, type TipTruth } from './types';

function generateMany(seed: number, count: number): GameState {
  const rng = createRng(seed);
  let s = createGame(WORLD, 0);
  for (let i = 0; i < count; i++) s = generateTip(s, WORLD, rng, i);
  return s;
}

describe('generateTip', () => {
  it('is deterministic for the same seed', () => {
    expect(generateMany(1, 20)).toEqual(generateMany(1, 20));
  });

  it('assigns unique ids and never points at the current location', () => {
    const s = generateMany(2, 200);
    expect(new Set(s.tips.map((t) => t.id)).size).toBe(200);
    expect(s.tips.every((t) => t.broadcast.placeId !== s.locationId)).toBe(true);
  });

  it('produces structured broadcasts only (GDD §9)', () => {
    const s = generateMany(3, 50);
    const phraseIds = new Set(WORLD.phrases.map((p) => p.id));
    for (const t of s.tips) {
      expect(Object.keys(t.broadcast).sort()).toEqual(['cargoKindId', 'payPerUnit', 'phrases', 'placeId', 'units']);
      expect(t.broadcast.phrases.every((p) => phraseIds.has(p))).toBe(true);
    }
  });

  it('matches claim and reality for good tips', () => {
    const s = generateMany(4, 300);
    for (const t of s.tips.filter((x) => x.truth === TIP_TRUTH.Good)) {
      const job = s.jobs[t.jobId!];
      expect(job.units).toBe(t.broadcast.units);
      expect(job.payPerUnit).toBe(t.broadcast.payPerUnit);
    }
  });

  it('makes bad tips worse than they sound', () => {
    const s = generateMany(5, 400);
    const byTruth = (truth: TipTruth) => s.tips.filter((t) => t.truth === truth);

    for (const t of byTruth(TIP_TRUTH.Scam)) expect(t.jobId).toBeNull();
    for (const t of byTruth(TIP_TRUTH.Exaggerated)) {
      const job = s.jobs[t.jobId!];
      expect(t.broadcast.units).toBeGreaterThan(job.units);
      expect(t.broadcast.payPerUnit).toBeGreaterThan(job.payPerUnit);
    }
    for (const t of byTruth(TIP_TRUTH.Outdated)) {
      expect(s.jobs[t.jobId!].units).toBeLessThanOrEqual(t.broadcast.units * BALANCE.outdatedKeepMax);
    }
    expect(byTruth(TIP_TRUTH.Scam).length).toBeGreaterThan(0);
    expect(byTruth(TIP_TRUTH.Exaggerated).length).toBeGreaterThan(0);
    expect(byTruth(TIP_TRUTH.Outdated).length).toBeGreaterThan(0);
  });

  it('only good-tip phrases are neutral; tells hint at the real truth', () => {
    const s = generateMany(6, 300);
    const hint = new Map(WORLD.phrases.map((p) => [p.id, p.hintsAt]));
    for (const t of s.tips) {
      for (const p of t.broadcast.phrases) {
        const h = hint.get(p);
        if (h !== null) expect(h).toBe(t.truth);
      }
    }
  });

  it('follows each broadcaster’s reliability', () => {
    const s = generateMany(7, 2000);
    const goodRate = (id: string) => {
      const tips = s.tips.filter((t) => t.broadcasterId === id);
      return tips.filter((t) => t.truth === TIP_TRUTH.Good).length / tips.length;
    };
    expect(goodRate('dispatcher')).toBeGreaterThan(goodRate('scammer'));
    expect(goodRate('scammer')).toBeLessThan(0.3);
  });
});
