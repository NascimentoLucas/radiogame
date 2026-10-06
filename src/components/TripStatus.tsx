import { StyleSheet, Text, View } from 'react-native';

import { getPlace, TRIP_KIND, type GameState, type World } from '@/game';
import { BALANCE } from '@/gd';

import { ActionButton } from './ActionButton';
import { formatDuration, formatLiters, formatMoney } from './format';
import { COLORS, SPACE } from './theme';

interface Props {
  game: GameState;
  world: World;
  now: number;
  onFillUp: () => void;
  onLocalJob: () => void;
}

/** Where the truck is: driving (with a countdown) or parked (with fuel and the dispatcher's local run). */
export function TripStatus({ game, world, now, onFillUp, onLocalJob }: Props) {
  const here = getPlace(world, game.locationId).name;
  const trip = game.trip;

  if (trip) {
    const title =
      trip.kind === TRIP_KIND.Tip ? `Driving to ${getPlace(world, trip.toPlaceId).name}` : 'Local dispatcher run';
    const progress = Math.min(1, Math.max(0, (now - trip.departAt) / (trip.arriveAt - trip.departAt)));
    return (
      <View style={styles.panel}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.detail}>Arriving in {formatDuration(trip.arriveAt - now)}</Text>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      </View>
    );
  }

  const missing = game.truck.fuelCapacity - game.fuel;
  const litersToBuy = Math.min(missing, game.money / BALANCE.fuelPricePerLiter);
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Parked at {here}</Text>
      <View style={styles.buttons}>
        <ActionButton
          label={
            litersToBuy >= 1
              ? `Fill up ${formatLiters(litersToBuy)} (${formatMoney(litersToBuy * BALANCE.fuelPricePerLiter)})`
              : 'Tank full'
          }
          onPress={onFillUp}
          disabled={litersToBuy < 1}
        />
        <ActionButton
          label={`Local run ${formatMoney(BALANCE.localJobPay)} · ${formatDuration(BALANCE.localJobDurationMs)}`}
          onPress={onLocalJob}
          color={COLORS.muted}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: SPACE,
    borderRadius: 10,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.panelBorder,
    gap: 8,
  },
  title: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  detail: { color: COLORS.muted, fontVariant: ['tabular-nums'] },
  bar: { height: 6, borderRadius: 3, backgroundColor: COLORS.panelBorder, overflow: 'hidden' },
  barFill: { height: 6, backgroundColor: COLORS.amber },
  buttons: { flexDirection: 'row', gap: 8 },
});
