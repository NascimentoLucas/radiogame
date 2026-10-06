import { StyleSheet, Text, View } from 'react-native';

export default function RadioScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Radio Trucker</Text>
      <Text style={styles.subtitle}>Tune in. Catch a signal. Decide.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d0f12' },
  title: { color: '#f2c14e', fontSize: 28, fontWeight: '700' },
  subtitle: { color: '#8a8f98', marginTop: 8 },
});
