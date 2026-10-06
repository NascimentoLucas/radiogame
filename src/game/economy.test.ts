import { BALANCE } from '@/gd';
import {
  applyRebroadcastToJob,
  cargoAt,
  distanceKm,
  estimateTrip,
  fuelCost,
  fuelForDistance,
  tripDurationMs,
  unitsLoadable,
} from './economy';
import { T0, TEST_WORLD, newGame, withTip } from './test-fixtures';
import type { Job } from './types';

const job: Job = { id: 'j', placeId: 'far', cargoKindId: 'box', payPerUnit: 10, units: 20, unitsAsOf: T0 };

describe('distance, fuel and travel time', () => {
  it('measures straight-line distance in km', () => {
    expect(distanceKm(TEST_WORLD, 'home', 'far')).toBe(100);
  });

  it('fuel scales with distance and truck efficiency', () => {
    expect(fuelForDistance(100, 0.35)).toBeCloseTo(35);
    expect(fuelCost(35)).toBeCloseTo(35 * BALANCE.fuelPricePerLiter);
  });

  it('trip time scales with distance, with a minimum', () => {
    expect(tripDurationMs(100)).toBe(100 * BALANCE.tripMsPerKm);
    expect(tripDurationMs(0)).toBe(BALANCE.minTripMs);
  });
});

describe('cargo over time', () => {
  it('halves every half-life', () => {
    expect(cargoAt(job, T0)).toBe(20);
    expect(cargoAt(job, T0 + BALANCE.cargoHalfLifeMs)).toBeCloseTo(10);
    expect(cargoAt(job, T0 + 2 * BALANCE.cargoHalfLifeMs)).toBeCloseTo(5);
  });

  it('does not change for times before the last update', () => {
    expect(cargoAt(job, T0 - 1000)).toBe(20);
  });

  it('a rebroadcast keeps only a fraction of the remaining cargo', () => {
    const cut = applyRebroadcastToJob(job, T0);
    expect(cut.units).toBeCloseTo(20 * BALANCE.rebroadcastCargoKeep);
    expect(BALANCE.rebroadcastCargoKeep).toBeLessThan(0.5); // "drops sharply" (GDD §4)
  });

  it('rebroadcasts compound', () => {
    const twice = applyRebroadcastToJob(applyRebroadcastToJob(job, T0), T0);
    expect(twice.units).toBeCloseTo(20 * BALANCE.rebroadcastCargoKeep ** 2);
  });

  it('loadable units are whole and capped by truck capacity', () => {
    expect(unitsLoadable({ ...job, units: 50 }, T0, 20)).toBe(20);
    expect(unitsLoadable({ ...job, units: 7.9 }, T0, 20)).toBe(7);
    expect(unitsLoadable(null, T0, 20)).toBe(0);
  });
});

describe('estimateTrip', () => {
  it('uses the broadcast claim, not the hidden job', () => {
    const { state, tipId } = withTip(newGame(), { units: 20, payPerUnit: 10, jobUnits: 1 });
    const e = estimateTrip(state, TEST_WORLD, tipId);
    expect(e.distanceKm).toBe(100);
    expect(e.fuelLiters).toBeCloseTo(100 * BALANCE.startTruck.litersPerKm);
    expect(e.claimedPayout).toBe(200);
    expect(e.claimedProfit).toBeCloseTo(200 - e.fuelCost);
  });

  it('caps the claimed payout at truck capacity', () => {
    const { state, tipId } = withTip(newGame(), { units: 999, payPerUnit: 10 });
    expect(estimateTrip(state, TEST_WORLD, tipId).claimedPayout).toBe(BALANCE.startTruck.cargoCapacity * 10);
  });
});
