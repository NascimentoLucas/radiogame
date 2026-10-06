import { go, rebroadcast, takeLocalJob } from './actions';
import { advance } from './advance';
import { BALANCE } from '@/gd';
import { tripDurationMs } from './economy';
import { T0, TEST_WORLD, newGame, unwrap, withTip } from './test-fixtures';
import { GAME_EVENT } from './types';
import { upcomingEventKey, upcomingEvents } from './upcoming';

const TRIP_MS = tripDurationMs(100);

describe('upcomingEvents', () => {
  it('is empty for a new game', () => {
    expect(upcomingEvents(newGame())).toEqual([]);
  });

  it('predicts a tip arrival at the same time advance resolves it', () => {
    const { state, tipId } = withTip(newGame());
    const departed = unwrap(go(state, TEST_WORLD, tipId, T0)).state;
    const [next] = upcomingEvents(departed);
    expect(next).toEqual({ type: GAME_EVENT.Arrived, tipId, placeId: 'far', at: T0 + TRIP_MS });

    const { events } = advance(departed, next.at);
    expect(events).toEqual([expect.objectContaining({ type: GAME_EVENT.Arrived, tipId, at: next.at })]);
  });

  it('predicts a local run', () => {
    const s = unwrap(takeLocalJob(newGame(), T0)).state;
    expect(upcomingEvents(s)).toEqual([{ type: GAME_EVENT.LocalJobDone, at: T0 + BALANCE.localJobDurationMs }]);
  });

  it('lists everything pending, soonest first, without revealing outcomes', () => {
    const { state, tipId } = withTip(newGame());
    const shared = unwrap(rebroadcast(state, tipId, T0)).state;
    const busy = unwrap(takeLocalJob(shared, T0)).state;
    const events = upcomingEvents(busy);
    expect(events.map((e) => e.type)).toEqual([GAME_EVENT.LikesSettled, GAME_EVENT.LocalJobDone]);
    expect(events[0]).toEqual({ type: GAME_EVENT.LikesSettled, tipId, at: T0 + BALANCE.likesSettleDelayMs });
  });

  it('drops events once they resolve', () => {
    const s = unwrap(takeLocalJob(newGame(), T0)).state;
    expect(upcomingEvents(advance(s, T0 + BALANCE.localJobDurationMs).state)).toEqual([]);
  });
});

describe('upcomingEventKey', () => {
  it('is stable for the same event and differs between events', () => {
    const a = { type: GAME_EVENT.Arrived, tipId: 't1', placeId: 'far', at: 5 } as const;
    expect(upcomingEventKey(a)).toBe(upcomingEventKey({ ...a }));
    expect(upcomingEventKey(a)).not.toBe(upcomingEventKey({ type: GAME_EVENT.LikesSettled, tipId: 't1', at: 5 }));
  });
});
