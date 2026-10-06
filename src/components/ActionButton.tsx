import { Pressable, StyleSheet, Text } from 'react-native';

import { COLORS } from './theme';

interface Props {
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
}

export function ActionButton({ label, onPress, color = COLORS.amber, disabled = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { borderColor: color },
        pressed && { backgroundColor: color + '33' },
        disabled && styles.disabled,
      ]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontWeight: '700', fontSize: 14 },
  disabled: { opacity: 0.35 },
});
