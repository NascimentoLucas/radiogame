import { render, screen, userEvent } from '@testing-library/react-native';

import { useGameStore } from '@/store/game-store';

import RadioScreen from '@/app/index';

beforeEach(() => {
  useGameStore.setState({ game: null, log: [], lastError: null, clockOffsetMs: 0 });
});

test('scan shows a tip card with the three decisions', async () => {
  const user = userEvent.setup();
  await render(<RadioScreen />);

  await screen.findByText('Only static. Scan for a signal.');
  await user.press(screen.getByText('Scan the band'));

  expect(screen.getByText('Go')).toBeOnTheScreen();
  expect(screen.getByText('Rebroadcast')).toBeOnTheScreen();
  expect(screen.getByText('Ignore')).toBeOnTheScreen();

  await user.press(screen.getByText('Ignore'));
  expect(screen.queryByText('Go')).toBeNull();
});
