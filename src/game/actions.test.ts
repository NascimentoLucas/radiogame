import { go, ignore, rebroadcast, refuel, takeLocalJob } from './actions';
import { advance } from './advance';
import { BALANCE } from './balance';
import { cargoAt, fuelCost, tripDurationMs } from './economy';
import { T0, TEST_WORLD, newGame, unwrap, withTip } from './test-fixtures';
import { ACTION_ERROR, TIP_STATUS, TIP_TRUTH } from './types';

const TRIP_MS = tripDurationMs(100);
const TRIP_FUEL = 100 * BALANCE.startTruck.litersPerKm;
/** Natural decay over one 100 km trip. */
const DECAY = Math.pow(0.5, TRIP_MS / BALANCE.cargoHalfLifeMs);

describe('createGame', () => {
  it('starts at home with starting resources', () => {
    const s = newGame();
    expect(s).toMatchObject({
      money: BALANCE.startMoney,
      fuel: BALANCE.startFuel,
      likes: 0,
      locationId: 'home',
      trip: null,
    });
  });
});

describe('go', () => {
  it('spends fuel at departure and pays on arrival', () => {
    const { state, tipId } = withTip(newGame(), { units: 20, payPerUnit: 10 });
    const departed = unwrap(go(state, TEST_WORLD, tipId, T0)).state;
    expect(departed.fuel).toBeCloseTo(BALANCE.startFuel - TRIP_FUEL);
    expect(departed.money).toBe(BALANCE.startMoney);
    expect(departed.trip).toMatchObject({ kind: 'tip', arriveAt: T0 + TRIP_MS });

    const { state: arrived, events } = advance(departed, T0 + TRIP_MS);
    const units = Math.floor(20 * DECAY);
    expect(events).toEqual([
      { type: 'arrived', tipId, placeId: 'far', unitsLoaded: units, payout: units * 10, at: T0 + TRIP_MS },
    ]);
    expect(arrived.money).toBe(BALANCE.startMoney + units * 10);
    expect(arrived.locationId).toBe('far');
    expect(arrived.trip).toBeNull();
  });

  it('does not arrive early', () => {
    const { state, tipId } = withTip(newGame());
    const departed = unwrap(go(state, TEST_WORLD, tipId, T0)).state;
    const r = advance(departed, T0 + TRIP_MS - 1);
    expect(r.events).toEqual([]);
    expect(r.state.trip).not.toBeNull();
  });

  it('removes loaded cargo from the job', () => {
    const { state, tipId } = withTip(newGame(), { units: 50 });
    const departed = unwrap(go(state, TEST_WORLD, tipId, T0)).state;
    const arrived = advance(departed, T0 + TRIP_MS).state;
    expect(arrived.jobs['j1'].units).toBeCloseTo(50 * DECAY - BALANCE.startTruck.cargoCapacity);
  });

  it('pays nothing for a scam', () => {
    const { state, tipId } = withTip(newGame(), { truth: TIP_TRUTH.Scam });
    const arrived = advance(unwrap(go(state, TEST_WORLD, tipId, T0)).state, T0 + TRIP_MS);
    expect(arrived.events[0]).toMatchObject({ type: 'arrived', unitsLoaded: 0, payout: 0 });
    expect(arrived.state.fuel).toBeCloseTo(BALANCE.startFuel - TRIP_FUEL);
  });

  it('pays the real amount for an exaggerated tip, not the claim', () => {
    const { state, tipId } = withTip(newGame(), { truth: TIP_TRUTH.Exaggerated, units: 40, jobUnits: 10 });
    const arrived = advance(unwrap(go(state, TEST_WORLD, tipId, T0)).state, T0 + TRIP_MS);
    expect(arrived.events[0]).toMatchObject({ unitsLoaded: Math.floor(10 * DECAY) });
  });

  it('refuses without enough fuel, while on a trip, or for a non-open tip', () => {
    const { state, tipId } = withTip(newGame());
    expect(go({ ...state, fuel: TRIP_FUEL - 0.1 }, TEST_WORLD, tipId, T0)).toEqual({
      ok: false,
      reason: ACTION_ERROR.NotEnoughFuel,
    });
    const departed = unwrap(go(state, TEST_WORLD, tipId, T0)).state;
    const second = withTip(departed);
    expect(go(second.state, TEST_WORLD, second.tipId, T0)).toEqual({ ok: false, reason: ACTION_ERROR.OnTrip });
    expect(go(advance(departed, T0 + TRIP_MS).state, TEST_WORLD, tipId, T0 + TRIP_MS)).toEqual({
      ok: false,
      reason: ACTION_ERROR.TipNotOpen,
    });
    expect(go(state, TEST_WORLD, 'nope', T0)).toEqual({ ok: false, reason: ACTION_ERROR.UnknownTip });
  });
});

describe('rebroadcast', () => {
  it('cuts the cargo at the job sharply and immediately', () => {
    const { state, tipId } = withTip(newGame(), { units: 20 });
    const s = unwrap(rebroadcast(state, tipId, T0)).state;
    expect(s.jobs['j1'].units).toBeCloseTo(20 * BALANCE.rebroadcastCargoKeep);
  });

  it('does not change fuel cost (GDD §4)', () => {
    const { state, tipId } = withTip(newGame());
    const plain = unwrap(go(state, TEST_WORLD, tipId, T0)).state;
    const shared = unwrap(go(unwrap(rebroadcast(state, tipId, T0)).state, TEST_WORLD, tipId, T0)).state;
    expect(shared.fuel).toBe(plain.fuel);
  });

  it('rebroadcast-then-go arrives to a smaller load and earns less', () => {
    const { state, tipId } = withTip(newGame(), { units: 20, payPerUnit: 10 });
    const plain = advance(unwrap(go(state, TEST_WORLD, tipId, T0)).state, T0 + TRIP_MS).state;
    const sharedStart = unwrap(rebroadcast(state, tipId, T0)).state;
    const shared = advance(unwrap(go(sharedStart, TEST_WORLD, tipId, T0)).state, T0 + TRIP_MS).state;

    const sharedUnits = Math.floor(20 * BALANCE.rebroadcastCargoKeep * DECAY);
    expect(shared.money).toBe(BALANCE.startMoney + sharedUnits * 10);
    expect(shared.money).toBeLessThan(plain.money);
  });

  it('can turn a profitable trip into a losing one', () => {
    const { state, tipId } = withTip(newGame(), { units: 20, payPerUnit: 5 });
    const tripCost = fuelCost(TRIP_FUEL);
    expect(Math.floor(20 * DECAY) * 5).toBeGreaterThan(tripCost);
    const sharedStart = unwrap(rebroadcast(state, tipId, T0)).state;
    const shared = advance(unwrap(go(sharedStart, TEST_WORLD, tipId, T0)).state, T0 + TRIP_MS);
    const arrival = shared.events.find((e) => e.type === 'arrived');
    expect(arrival).toMatchObject({ type: 'arrived' });
    expect(arrival?.type === 'arrived' && arrival.payout).toBeLessThan(tripCost);
  });

  it('settles Likes later: gain for a good tip', () => {
    const { state, tipId } = withTip(newGame());
    const s = unwrap(rebroadcast(state, tipId, T0)).state;
    expect(s.likes).toBe(0);
    expect(advance(s, T0 + BALANCE.likesSettleDelayMs - 1).state.likes).toBe(0);
    const settled = advance(s, T0 + BALANCE.likesSettleDelayMs);
    expect(settled.state.likes).toBe(BALANCE.likesPerGoodRebroadcast);
    expect(settled.events).toEqual([
      { type: 'likes-settled', tipId, delta: BALANCE.likesPerGoodRebroadcast, at: T0 + BALANCE.likesSettleDelayMs },
    ]);
  });

  it.each([TIP_TRUTH.Outdated, TIP_TRUTH.Exaggerated, TIP_TRUTH.Scam])('loses Likes for a bad tip (%s)', (truth) => {
    let s = { ...newGame(), likes: 20 };
    const added = withTip(s, { truth });
    s = unwrap(rebroadcast(added.state, added.tipId, T0)).state;
    expect(advance(s, T0 + BALANCE.likesSettleDelayMs).state.likes).toBe(20 + BALANCE.likesPerBadRebroadcast);
  });

  it('never drops Likes below zero', () => {
    const { state, tipId } = withTip(newGame(), { truth: TIP_TRUTH.Scam });
    const s = unwrap(rebroadcast(state, tipId, T0)).state;
    expect(advance(s, T0 + BALANCE.likesSettleDelayMs).state.likes).toBe(0);
  });

  it('only once per tip, and not after committing to Go or Ignore', () => {
    const { state, tipId } = withTip(newGame());
    const once = unwrap(rebroadcast(state, tipId, T0)).state;
    expect(rebroadcast(once, tipId, T0)).toEqual({ ok: false, reason: ACTION_ERROR.TipNotOpen });
    const taken = unwrap(go(state, TEST_WORLD, tipId, T0)).state;
    expect(rebroadcast(taken, tipId, T0)).toEqual({ ok: false, reason: ACTION_ERROR.TipNotOpen });
    const ignored = unwrap(ignore(state, tipId, T0)).state;
    expect(rebroadcast(ignored, tipId, T0)).toEqual({ ok: false, reason: ACTION_ERROR.TipNotOpen });
  });

  it('works while driving to another job', () => {
    const a = withTip(newGame());
    const departed = unwrap(go(a.state, TEST_WORLD, a.tipId, T0)).state;
    const b = withTip(departed);
    expect(rebroadcast(b.state, b.tipId, T0 + 1000).ok).toBe(true);
  });
});

describe('ignore', () => {
  it('changes nothing but the tip status', () => {
    const { state, tipId } = withTip(newGame());
    const s = unwrap(ignore(state, tipId, T0)).state;
    expect(s.tips[0].status).toBe(TIP_STATUS.Ignored);
    expect(s.money).toBe(state.money);
    expect(s.fuel).toBe(state.fuel);
    expect(s.likes).toBe(state.likes);
    expect(s.jobs).toEqual(state.jobs);
    expect(go(s, TEST_WORLD, tipId, T0)).toEqual({ ok: false, reason: ACTION_ERROR.TipNotOpen });
  });
});

describe('refuel', () => {
  it('buys fuel up to tank capacity', () => {
    const s = unwrap(refuel({ ...newGame(), fuel: 0, money: 10_000 }, Infinity, T0)).state;
    expect(s.fuel).toBe(BALANCE.startTruck.fuelCapacity);
    expect(s.money).toBeCloseTo(10_000 - BALANCE.startTruck.fuelCapacity * BALANCE.fuelPricePerLiter);
  });

  it('is limited by money and never goes negative', () => {
    const s = unwrap(refuel({ ...newGame(), fuel: 0, money: 15 }, Infinity, T0)).state;
    expect(s.fuel).toBeCloseTo(15 / BALANCE.fuelPricePerLiter);
    expect(s.money).toBeCloseTo(0);
  });

  it('refuses when broke or full', () => {
    expect(refuel({ ...newGame(), money: 0 }, 10, T0)).toEqual({ ok: false, reason: ACTION_ERROR.NothingToRefuel });
    const full = { ...newGame(), fuel: BALANCE.startTruck.fuelCapacity };
    expect(refuel(full, 10, T0)).toEqual({ ok: false, reason: ACTION_ERROR.NothingToRefuel });
  });
});

describe('no fail state', () => {
  it('a broke driver with an empty tank can always take a local job and recover', () => {
    const broke = { ...newGame(), money: 0, fuel: 0 };
    const working = unwrap(takeLocalJob(broke, T0)).state;
    const done = advance(working, T0 + BALANCE.localJobDurationMs);
    expect(done.events).toEqual([
      { type: 'local-job-done', pay: BALANCE.localJobPay, at: T0 + BALANCE.localJobDurationMs },
    ]);
    expect(done.state.money).toBe(BALANCE.localJobPay);
    expect(refuel(done.state, Infinity, T0 + BALANCE.localJobDurationMs).ok).toBe(true);
  });

  it('local job needs no fuel', () => {
    const s = unwrap(takeLocalJob({ ...newGame(), fuel: 0 }, T0)).state;
    expect(s.fuel).toBe(0);
  });
});

describe('advance', () => {
  it('processes events in chronological order', () => {
    const a = withTip(newGame());
    const shared = unwrap(rebroadcast(a.state, a.tipId, T0)).state; // Likes settle at T0 + delay
    const b = withTip(shared);
    const departed = unwrap(go(b.state, TEST_WORLD, b.tipId, T0)).state; // arrives at T0 + TRIP_MS
    const { events } = advance(departed, T0 + 10 * TRIP_MS);
    expect(events.map((e) => e.at)).toEqual([...events.map((e) => e.at)].sort((x, y) => x - y));
    expect(events).toHaveLength(2);
  });

  it('applies a rebroadcast made after arrival without touching the load already taken', () => {
    const { state, tipId } = withTip(newGame(), { units: 20 });
    const departed = unwrap(go(state, TEST_WORLD, tipId, T0)).state;
    // The player comes back long after arrival; the arrival must resolve before anything else.
    const later = T0 + TRIP_MS + 60_000;
    const b = withTip(departed, { at: later });
    const r = unwrap(rebroadcast(b.state, b.tipId, later));
    expect(r.events[0]).toMatchObject({ type: 'arrived', unitsLoaded: Math.floor(20 * DECAY) });
  });

  it('ignores clocks that run backwards', () => {
    const s = newGame();
    const r = advance(s, T0 - 10_000);
    expect(r.state.lastUpdatedAt).toBe(T0);
    expect(r.events).toEqual([]);
  });

  it('cargo keeps disappearing while you are away', () => {
    const { state } = withTip(newGame(), { units: 20 });
    expect(cargoAt(state.jobs['j1'], T0 + BALANCE.cargoHalfLifeMs)).toBeCloseTo(10);
  });
});
