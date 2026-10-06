import { StyleSheet, Text, View } from 'react-native';

import { estimateTrip, getPlace, type GameState, type Tip, type World } from '@/game';

import { ActionButton } from './ActionButton';
import { formatDuration, formatKm, formatLiters, formatMoney } from './format';
import { COLORS, SPACE } from './theme';

interface Props {
  tip: Tip;
  game: GameState;
  world: World;
  onGo: () => void;
  onRebroadcast: () => void;
  onIgnore: () => void;
}

/**
 * One heard broadcast. Shows only the claim, the broadcaster and `estimateTrip`:
 * never the hidden truth or job.
 */
export function TipCard({ tip, game, world, onGo, onRebroadcast, onIgnore }: Props) {
  const { broadcast } = tip;
  const broadcaster = world.broadcasters.find((b) => b.id === tip.broadcasterId);
  const cargo = world.cargoKinds.find((c) => c.id === broadcast.cargoKindId);
  const place = getPlace(world, broadcast.placeId);
  const estimate = estimateTrip(game, world, tip.id);
  const phrases = broadcast.phrases.map((id) => world.phrases.find((p) => p.id === id)?.text).filter(Boolean);

  const atDestination = game.locationId === broadcast.placeId;
  const fuelNeeded = estimate.fuelLiters;
  const lowFuel = fuelNeeded > game.fuel;
  const rebroadcasted = tip.rebroadcastAt !== null;

  let goHint: string | null = null;
  if (game.trip) goHint = 'On the road';
  else if (lowFuel) goHint = `Needs ${formatLiters(fuelNeeded)} of fuel`;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.broadcaster}>{broadcaster?.name ?? 'Unknown voice'}</Text>
        {broadcaster ? (
          <Text style={styles.reliability}>Trust {Math.round(broadcaster.perceivedReliability * 100)}%</Text>
        ) : null}
      </View>

      <Text style={styles.claim}>
        {broadcast.units} × {cargo?.name ?? broadcast.cargoKindId} at {formatMoney(broadcast.payPerUnit)}/unit
      </Text>
      <Text style={styles.detail}>
        {place.name}
        {atDestination ? ' (you are here)' : ` · ${formatKm(estimate.distanceKm)} · ${formatDuration(estimate.durationMs)}`}
      </Text>
      {phrases.map((text, i) => (
        <Text key={i} style={styles.phrase}>
          “{text}”
        </Text>
      ))}

      <Text style={styles.detail}>
        Fuel {formatMoney(estimate.fuelCost)} · If true, profit{' '}
        <Text style={{ color: estimate.claimedProfit >= 0 ? COLORS.green : COLORS.red }}>
          {formatMoney(estimate.claimedProfit)}
        </Text>
      </Text>

      {rebroadcasted ? <Text style={styles.badge}>Rebroadcast. Other drivers heard it too.</Text> : null}
      {goHint ? <Text style={styles.hint}>{goHint}</Text> : null}

      <View style={styles.buttons}>
        <ActionButton label="Go" onPress={onGo} color={COLORS.green} disabled={goHint !== null} />
        <ActionButton label="Rebroadcast" onPress={onRebroadcast} color={COLORS.blue} disabled={rebroadcasted} />
        <ActionButton label="Ignore" onPress={onIgnore} color={COLORS.muted} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: SPACE,
    borderRadius: 10,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.panelBorder,
    gap: 6,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  broadcaster: { color: COLORS.amber, fontWeight: '700', fontSize: 15 },
  reliability: { color: COLORS.muted, fontSize: 12 },
  claim: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  detail: { color: COLORS.muted, fontVariant: ['tabular-nums'] },
  phrase: { color: COLORS.text, fontStyle: 'italic' },
  badge: { color: COLORS.blue, fontSize: 12 },
  hint: { color: COLORS.red, fontSize: 12 },
  buttons: { flexDirection: 'row', gap: 8, marginTop: 4 },
});
