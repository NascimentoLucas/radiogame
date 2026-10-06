import { ACTION_ERROR, GAME_EVENT, TIP_STATUS, TRIP_KIND } from '@/game';
import { BALANCE } from '@/gd';

import { useGameStore } from './game-store';

const HOUR = 60 * 60_000;

function store() {
  return useGameStore.getState();
}

beforeEach(() => {
  useGameStore.setState({ game: null, log: [], lastError: null, clockOffsetMs: 0 });
  store().start();
});

test('start creates a fresh game', () => {
  const { game } = store();
  expect(game).not.toBeNull();
  expect(game!.money).toBe(BALANCE.startMoney);
  expect(game!.tips).toHaveLength(0);
});

test('start keeps an existing game', () => {
  store().scan();
  const before = store().game;
  store().start();
  expect(store().game!.tips).toEqual(before!.tips);
});

test('scan hears a new open tip', () => {
  store().scan();
  store().scan();
  const tips = store().game!.tips;
  expect(tips).toHaveLength(2);
  expect(tips.every((t) => t.status === TIP_STATUS.Open)).toBe(true);
});

test('go starts a trip and the arrival shows up in the log after time passes', () => {
  store().scan();
  const tipId = store().game!.tips[0].id;
  store().go(tipId);
  expect(store().lastError).toBeNull();
  expect(store().game!.trip?.kind).toBe(TRIP_KIND.Tip);

  store().devSkip(24 * HOUR);
  expect(store().game!.trip).toBeNull();
  expect(store().log[0]).toMatchObject({ type: GAME_EVENT.Arrived, tipId });
});

test('ignore closes the tip', () => {
  store().scan();
  const tipId = store().game!.tips[0].id;
  store().ignore(tipId);
  expect(store().game!.tips[0].status).toBe(TIP_STATUS.Ignored);
});

test('rebroadcast queues Likes that settle later', () => {
  store().scan();
  const tipId = store().game!.tips[0].id;
  store().rebroadcast(tipId);
  expect(store().game!.pendingLikes).toHaveLength(1);

  store().devSkip(BALANCE.likesSettleDelayMs);
  expect(store().game!.pendingLikes).toHaveLength(0);
  expect(store().log[0]).toMatchObject({ type: GAME_EVENT.LikesSettled, tipId });
});

test('a failed action records the reason instead of throwing', () => {
  store().takeLocalJob();
  store().takeLocalJob();
  expect(store().lastError).toBe(ACTION_ERROR.OnTrip);
  store().dismissError();
  expect(store().lastError).toBeNull();
});

test('the local run always pays, even when broke', () => {
  useGameStore.setState({ game: { ...store().game!, money: 0, fuel: 0 } });
  store().takeLocalJob();
  store().devSkip(BALANCE.localJobDurationMs);
  expect(store().game!.money).toBe(BALANCE.localJobPay);
});
