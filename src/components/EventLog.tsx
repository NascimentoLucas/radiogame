import { StyleSheet, Text, View } from 'react-native';

import type { GameEvent, World } from '@/game';

import { describeEvent } from './format';
import { COLORS } from './theme';

const SHOWN = 5;

export function EventLog({ events, world }: { events: GameEvent[]; world: World }) {
  if (events.length === 0) return null;
  return (
    <View style={styles.log}>
      {events.slice(0, SHOWN).map((event, i) => (
        <Text key={`${event.type}-${event.at}-${i}`} style={[styles.line, i === 0 && styles.latest]}>
          {describeEvent(event, world)}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  log: { gap: 4 },
  line: { color: COLORS.muted, fontSize: 13 },
  latest: { color: COLORS.text },
});
