/**
 * Paper-prototype checks (GDD §12): does the dilemma hold with the current balance?
 * These compare strategies over many tips on the real content, so they catch balance changes that break it.
 */
import { WORLD } from '@/content/world';

import { BALANCE } from '@/gd';
import { runSim, STRATEGIES, STRATEGY, type StrategyName } from './sim';

const TIPS = 300;
const SEEDS = [1, 2, 3, 4, 5];

function average(strategy: StrategyName) {
  const runs = SEEDS.map((seed) => runSim({ world: WORLD, strategy: STRATEGIES[strategy], seed, tipCount: TIPS }));
  const avg = (f: (r: (typeof runs)[number]) => number) => runs.reduce((sum, r) => sum + f(r), 0) / runs.length;
  return {
    netWorth: avg((r) => r.netWorth),
    likes: avg((r) => r.likes),
    likesPerRebroadcast: avg((r) => (r.rebroadcasts > 0 ? r.likes / r.rebroadcasts : 0)),
    payout: avg((r) => r.totalPayout),
  };
}

const startNetWorth = BALANCE.startMoney + BALANCE.startFuel * BALANCE.fuelPricePerLiter;

describe('paper prototype', () => {
  const results = {
    [STRATEGY.IgnoreAll]: average(STRATEGY.IgnoreAll),
    [STRATEGY.GoAll]: average(STRATEGY.GoAll),
    [STRATEGY.RebroadcastAll]: average(STRATEGY.RebroadcastAll),
    [STRATEGY.RebroadcastThenGo]: average(STRATEGY.RebroadcastThenGo),
    [STRATEGY.Careful]: average(STRATEGY.Careful),
  };

  it('ignoring everything changes nothing', () => {
    expect(results[STRATEGY.IgnoreAll].netWorth).toBe(startNetWorth);
    expect(results[STRATEGY.IgnoreAll].likes).toBe(0);
  });

  it('going is how you make money', () => {
    expect(results[STRATEGY.GoAll].netWorth).toBeGreaterThan(startNetWorth);
    expect(results[STRATEGY.GoAll].likes).toBe(0);
  });

  it('rebroadcasting is how you earn Likes, but it earns no money', () => {
    expect(results[STRATEGY.RebroadcastAll].likes).toBeGreaterThan(0);
    expect(results[STRATEGY.RebroadcastAll].netWorth).toBe(startNetWorth);
  });

  it('sharing a tip and then driving to it pays much less than keeping it', () => {
    expect(results[STRATEGY.RebroadcastThenGo].payout).toBeLessThan(results[STRATEGY.GoAll].payout * 0.6);
    expect(results[STRATEGY.RebroadcastThenGo].netWorth).toBeLessThan(results[STRATEGY.GoAll].netWorth);
  });

  it('careful listening beats blind play: more money, and more Likes per tip shared', () => {
    const { Careful, GoAll, RebroadcastAll } = STRATEGY;
    expect(results[Careful].netWorth).toBeGreaterThan(results[GoAll].netWorth);
    expect(results[Careful].likesPerRebroadcast).toBeGreaterThan(results[RebroadcastAll].likesPerRebroadcast);
  });

  it('is deterministic', () => {
    const a = runSim({ world: WORLD, strategy: STRATEGIES[STRATEGY.Careful], seed: 9, tipCount: 50 });
    const b = runSim({ world: WORLD, strategy: STRATEGIES[STRATEGY.Careful], seed: 9, tipCount: 50 });
    expect(a).toEqual(b);
  });

  it('never leaves the driver with negative money or fuel', () => {
    for (const s of Object.values(STRATEGIES)) {
      const r = runSim({ world: WORLD, strategy: s, seed: 11, tipCount: 200 });
      expect(r.money).toBeGreaterThanOrEqual(0);
      expect(r.state.fuel).toBeGreaterThanOrEqual(0);
    }
  });
});
