import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, Muted, SectionLabel, Title } from '@/components/primitives';
import { deleteAllData } from '@/db/client';
import type { Unit } from '@/domain/types';
import { deleteAllPhotos } from '@/media/photos';
import { useSettings } from '@/state/settings';
import { color, radius, space, type } from '@/theme/tokens';

/**
 * Settings — units, delete all data, privacy policy, version. That is the whole
 * tab, deliberately.
 */

/**
 * Replace this before submitting: App Store Connect requires a reachable
 * privacy policy URL, and it must match the one entered in the listing.
 */
const PRIVACY_POLICY_URL = 'https://example.com/repa/privacy';

const UNITS: Unit[] = ['lb', 'kg'];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { unit, setUnit } = useSettings();

  const version = Constants.expoConfig?.version ?? '1.0.0';

  function confirmDeleteAll() {
    Alert.alert(
      'Delete all data?',
      'Every workout, custom exercise and photo will be permanently removed from this device. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllData();
              deleteAllPhotos();
              Alert.alert('Deleted', 'Repa is back to a fresh start.');
            } catch (error) {
              console.error('[repa] failed to delete all data', error);
              Alert.alert('Could not delete', 'Something went wrong. Please try again.');
            }
          },
        },
      ],
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.xxl },
      ]}
    >
      <Title style={styles.title}>Settings</Title>

      <SectionLabel>Units</SectionLabel>
      <Card style={styles.card}>
        <View style={styles.segment}>
          {UNITS.map((option) => {
            const selected = unit === option;
            return (
              <Pressable
                key={option}
                onPress={() => setUnit(option)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={option === 'lb' ? 'Pounds' : 'Kilograms'}
                style={[styles.segmentOption, selected && styles.segmentSelected]}
              >
                <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Muted style={styles.hint}>
          Weights are stored once and converted only for display, so switching back and forth
          never changes what you logged.
        </Muted>
      </Card>

      <SectionLabel style={styles.sectionSpacing}>About</SectionLabel>
      <Card style={styles.card}>
        <Pressable
          onPress={() => void WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}
          accessibilityRole="link"
          accessibilityLabel="Privacy policy"
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <Text style={styles.rowLabel}>Privacy policy</Text>
          <Muted>Opens in browser</Muted>
        </Pressable>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Version</Text>
          <Muted>{version}</Muted>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Your data</Text>
          <Muted>Stays on this device</Muted>
        </View>
      </Card>

      <SectionLabel style={styles.sectionSpacing}>Danger zone</SectionLabel>
      <Card style={styles.card}>
        <Pressable
          onPress={confirmDeleteAll}
          accessibilityRole="button"
          accessibilityLabel="Delete all data"
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <Text style={styles.dangerLabel}>Delete all data</Text>
        </Pressable>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { paddingHorizontal: space.lg, gap: space.sm },
  title: { marginBottom: space.md },
  card: { gap: space.sm, paddingVertical: space.md },
  sectionSpacing: { marginTop: space.lg },
  segment: {
    flexDirection: 'row',
    backgroundColor: color.bg,
    borderRadius: radius.md,
    padding: 3,
    gap: 3,
  },
  segmentOption: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  segmentSelected: {
    backgroundColor: color.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.hairlineStrong,
  },
  segmentText: { fontSize: 17, fontWeight: '600', color: color.muted },
  segmentTextSelected: { color: color.ink },
  hint: { lineHeight: 19 },
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: { ...type.body, color: color.ink },
  dangerLabel: { ...type.body, color: color.danger },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: color.hairline },
  pressed: { opacity: 0.6 },
});
