import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useNotificationSync } from '@/notifications/use-notification-sync';

export default function RootLayout() {
  useNotificationSync();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0d0f12' } }} />
    </GestureHandlerRootView>
  );
}
