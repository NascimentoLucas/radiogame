import { StyleSheet, Text, View } from 'react-native';

import { NAMES } from '@/content/names';
import type { GameState } from '@/game';

import { formatLiters, formatMoney } from './format';
import { COLORS, SPACE } from './theme';

export function Hud({ game }: { game: GameState }) {
  const fuelRatio = game.fuel / game.truck.fuelCapacity;
  const pending = game.pendingLikes.length;

  return (
    <View style={styles.row}>
      <Stat label="Money" value={formatMoney(game.money)} color={COLORS.green} />
      <Stat
        label={NAMES.likes}
        value={String(game.likes)}
        color={COLORS.blue}
        note={pending > 0 ? `${pending} pending` : undefined}
      />
      <View style={styles.stat}>
        <Text style={styles.label}>Fuel</Text>
        <Text style={[styles.value, { color: fuelRatio < 0.2 ? COLORS.red : COLORS.amber }]}>
          {formatLiters(game.fuel)}
        </Text>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${Math.round(fuelRatio * 100)}%` }]} />
        </View>
      </View>
    </View>
  );
}

function Stat({ label, value, color, note }: { label: string; value: string; color: string; note?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: SPACE },
  stat: {
    flex: 1,
    padding: SPACE,
    borderRadius: 10,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.panelBorder,
  },
  label: { color: COLORS.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  value: { fontSize: 22, fontWeight: '700', marginTop: 2, fontVariant: ['tabular-nums'] },
  note: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  bar: { height: 4, borderRadius: 2, backgroundColor: COLORS.panelBorder, marginTop: 6, overflow: 'hidden' },
  barFill: { height: 4, backgroundColor: COLORS.amber },
});
