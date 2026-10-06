import * as Notifications from 'expo-notifications';

import { resetNotificationsForTests, scheduleNotifications } from './scheduler';

jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { DATE: 'date' },
  AndroidImportance: { DEFAULT: 3 },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => null),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
  scheduleNotificationAsync: jest.fn(async () => 'id'),
  dismissAllNotificationsAsync: jest.fn(async () => undefined),
}));

const N = jest.mocked(Notifications);
const future = () => ({ id: 'arrived:t1', fireAt: Date.now() + 60_000, title: 'T', body: 'B' });

function permission(granted: boolean, canAskAgain = true) {
  return { granted, canAskAgain, status: granted ? 'granted' : 'undetermined', expires: 'never' } as never;
}

beforeEach(() => {
  jest.clearAllMocks();
  resetNotificationsForTests();
});

test('schedules each planned notification at its fire time', async () => {
  N.getPermissionsAsync.mockResolvedValue(permission(true));
  const n = future();
  await scheduleNotifications([n]);
  expect(N.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
  expect(N.scheduleNotificationAsync).toHaveBeenCalledWith(
    expect.objectContaining({ identifier: n.id, trigger: expect.objectContaining({ date: n.fireAt }) }),
  );
});

test('does nothing when the plan has not changed', async () => {
  N.getPermissionsAsync.mockResolvedValue(permission(true));
  const n = future();
  await scheduleNotifications([n]);
  await scheduleNotifications([{ ...n }]);
  expect(N.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
});

test('an empty plan cancels without asking for permission', async () => {
  N.getPermissionsAsync.mockResolvedValue(permission(true));
  await scheduleNotifications([future()]);
  await scheduleNotifications([]);
  expect(N.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(2);
  expect(N.getPermissionsAsync).toHaveBeenCalledTimes(1);
});

test('asks once, and schedules nothing if refused', async () => {
  N.getPermissionsAsync.mockResolvedValue(permission(false));
  N.requestPermissionsAsync.mockResolvedValue(permission(false));
  await scheduleNotifications([future()]);
  await scheduleNotifications([{ ...future(), id: 'local-job-done:1' }]);
  expect(N.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
});

test('skips notifications whose time already passed', async () => {
  N.getPermissionsAsync.mockResolvedValue(permission(true));
  await scheduleNotifications([{ ...future(), fireAt: Date.now() - 1 }]);
  expect(N.scheduleNotificationAsync).not.toHaveBeenCalled();
});

test('an OS error does not throw and allows a retry', async () => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  N.getPermissionsAsync.mockResolvedValue(permission(true));
  N.scheduleNotificationAsync.mockRejectedValueOnce(new Error('boom'));
  const n = future();
  await scheduleNotifications([n]);
  await scheduleNotifications([n]);
  expect(N.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
});
