import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { seedDemoDataIfEnabled } from '@/data/demo';
import { getDatabase } from '@/db/client';
import { SettingsProvider } from '@/state/settings';
import { color, space, type } from '@/theme/tokens';

/**
 * App shell.
 *
 * The splash stays up until SQLite has opened and migrated, so the first screen
 * a user sees already has their data on it rather than flashing an empty state.
 */

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await getDatabase();
        await seedDemoDataIfEnabled();
      } catch (error) {
        console.error('[repa] failed to open the database', error);
        setFailure(error instanceof Error ? error.message : String(error));
      } finally {
        setReady(true);
        await SplashScreen.hideAsync();
      }
    })();
  }, []);

  if (!ready) return null;

  // The database is the whole app; there is no sensible degraded mode, so say
  // plainly what happened rather than showing empty screens that look like
  // lost data.
  if (failure) {
    return (
      <View style={styles.failure}>
        <Text style={styles.failureTitle}>Repa could not open your workouts</Text>
        <Text style={styles.failureBody}>
          Restarting the app usually fixes this. Your data has not been deleted.
        </Text>
        <Text style={styles.failureDetail}>{failure}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <SettingsProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: color.bg },
              headerShadowVisible: false,
              headerTintColor: color.ink,
              headerTitleStyle: { fontSize: 17, fontWeight: '600' },
              contentStyle: { backgroundColor: color.bg },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="session/[id]" options={{ title: 'Workout' }} />
            <Stack.Screen name="history" options={{ title: 'History' }} />
            <Stack.Screen name="exercise/[id]" options={{ title: 'Exercise' }} />
          </Stack>
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg },
  failure: {
    flex: 1,
    backgroundColor: color.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
    gap: space.md,
  },
  failureTitle: { ...type.heading, color: color.ink, textAlign: 'center' },
  failureBody: { ...type.body, color: color.muted, textAlign: 'center' },
  failureDetail: { ...type.small, color: color.ghost, textAlign: 'center' },
});
