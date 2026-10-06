import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/ActionButton';
import { EventLog } from '@/components/EventLog';
import { Hud } from '@/components/Hud';
import { TipCard } from '@/components/TipCard';
import { TripStatus } from '@/components/TripStatus';
import { COLORS, SPACE } from '@/components/theme';
import { NAMES } from '@/content/names';
import { WORLD } from '@/content/world';
import { ACTION_ERROR, TIP_STATUS, type ActionError } from '@/game';
import { useGameStore } from '@/store/game-store';
import { useGameClock } from '@/store/use-game-clock';

const ERROR_TEXT: Record<ActionError, string> = {
  [ACTION_ERROR.UnknownTip]: 'That signal is gone.',
  [ACTION_ERROR.TipNotOpen]: 'You already acted on that signal.',
  [ACTION_ERROR.OnTrip]: "You're on the road.",
  [ACTION_ERROR.NotEnoughFuel]: 'Not enough fuel for that trip.',
  [ACTION_ERROR.NothingToRefuel]: "Can't buy fuel right now.",
};

const MINUTE = 60_000;

export default function RadioScreen() {
  const now = useGameClock();
  const store = useGameStore();
  const { game } = store;

  if (now === null || !game) {
    return (
      <View style={styles.loading}>
        <Text style={styles.muted}>Warming up the radio…</Text>
      </View>
    );
  }

  const openTips = game.tips.filter((t) => t.status === TIP_STATUS.Open).reverse();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{NAMES.game}</Text>
        <Hud game={game} />
        <TripStatus
          game={game}
          world={WORLD}
          now={now}
          onFillUp={store.fillUp}
          onLocalJob={store.takeLocalJob}
        />

        {store.lastError ? (
          <Text style={styles.error} onPress={store.dismissError}>
            {ERROR_TEXT[store.lastError]}
          </Text>
        ) : null}

        <EventLog events={store.log} world={WORLD} />

        <View style={styles.sectionHeader}>
          <Text style={styles.section}>On the air</Text>
        </View>
        {/* Placeholder for the tuning dial (build order step 4). */}
        <View style={styles.row}>
          <ActionButton label="Scan the band" onPress={store.scan} />
        </View>
        {openTips.length === 0 ? <Text style={styles.muted}>Only static. Scan for a signal.</Text> : null}
        {openTips.map((tip) => (
          <TipCard
            key={tip.id}
            tip={tip}
            game={game}
            world={WORLD}
            onGo={() => store.go(tip.id)}
            onRebroadcast={() => store.rebroadcast(tip.id)}
            onIgnore={() => store.ignore(tip.id)}
          />
        ))}

        {__DEV__ ? (
          <View style={styles.row}>
            <ActionButton label="Dev: +10 min" onPress={() => store.devSkip(10 * MINUTE)} color={COLORS.muted} />
            <ActionButton label="Dev: new game" onPress={store.devReset} color={COLORS.red} />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  content: { padding: SPACE, gap: SPACE, width: '100%', maxWidth: 560, alignSelf: 'center' },
  title: { color: COLORS.amber, fontSize: 22, fontWeight: '700' },
  sectionHeader: { marginTop: SPACE },
  section: { color: COLORS.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  row: { flexDirection: 'row', gap: 8 },
  muted: { color: COLORS.muted },
  error: { color: COLORS.red },
});
