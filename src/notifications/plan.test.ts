import { GAME_EVENT } from '@/game';
import { TEST_WORLD } from '@/game/test-fixtures';

import { planNotifications, planSignature } from './plan';

test('notifies arrivals and local runs, not Likes settling', () => {
  const plan = planNotifications(
    [
      { type: GAME_EVENT.LikesSettled, tipId: 't1', at: 1000 },
      { type: GAME_EVENT.Arrived, tipId: 't2', placeId: 'far', at: 2000 },
      { type: GAME_EVENT.LocalJobDone, at: 3000 },
    ],
    TEST_WORLD,
    0,
  );
  expect(plan.map((n) => n.id)).toEqual(['arrived:t2', 'local-job-done:3000']);
  expect(plan[0].title).toContain('Far');
});

test('converts game time to wall time using the dev clock offset', () => {
  const [n] = planNotifications([{ type: GAME_EVENT.Arrived, tipId: 't1', placeId: 'far', at: 10_000 }], TEST_WORLD, 4000);
  expect(n.fireAt).toBe(6000);
});

test('never leaks an outcome into the text', () => {
  const [n] = planNotifications([{ type: GAME_EVENT.Arrived, tipId: 't1', placeId: 'far', at: 1 }], TEST_WORLD, 0);
  expect(`${n.title} ${n.body}`).not.toMatch(/\$|\d/);
});

test('signature changes only when the plan does', () => {
  const a = planNotifications([{ type: GAME_EVENT.LocalJobDone, at: 5 }], TEST_WORLD, 0);
  const b = planNotifications([{ type: GAME_EVENT.LocalJobDone, at: 5 }], TEST_WORLD, 0);
  expect(planSignature(a)).toBe(planSignature(b));
  expect(planSignature(a)).not.toBe(planSignature([]));
});
