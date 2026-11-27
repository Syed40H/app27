import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { parseRepsInput } from '@/domain/units';
import { color, radius, space, tabularNums, type } from '@/theme/tokens';
import { Button, SectionLabel } from './primitives';

const COMMON_REPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/**
 * Reps entry: a grid of 1–12 for the common case, and a type-in for anything
 * outside that range. Reps are always required, so there is no "clear" option —
 * dismissing without choosing simply leaves the set as it was.
 */
export function RepsPicker({
  visible,
  initial,
  onCancel,
  onSelect,
}: {
  visible: boolean;
  initial: number | null;
  onCancel: () => void;
  onSelect: (reps: number) => void;
}) {
  const [custom, setCustom] = useState('');

  useEffect(() => {
    if (visible) setCustom(initial !== null && initial > 12 ? String(initial) : '');
  }, [visible, initial]);

  const parsedCustom = parseRepsInput(custom);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable style={styles.scrim} onPress={onCancel} accessibilityLabel="Close reps picker" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrap}
      >
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <SectionLabel style={styles.label}>Reps</SectionLabel>

          <View style={styles.grid}>
            {COMMON_REPS.map((reps) => {
              const selected = initial === reps;
              return (
                <Pressable
                  key={reps}
                  onPress={() => onSelect(reps)}
                  accessibilityRole="button"
                  accessibilityLabel={`${reps} reps`}
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [
                    styles.tile,
                    selected && styles.tileSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.tileText, selected && styles.tileTextSelected]}>
                    {reps}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <SectionLabel style={styles.label}>Or type a number</SectionLabel>
          <View style={styles.customRow}>
            <TextInput
              value={custom}
              onChangeText={setCustom}
              keyboardType="number-pad"
              placeholder="15"
              placeholderTextColor={color.ghost}
              style={styles.customInput}
              accessibilityLabel="Custom reps"
              returnKeyType="done"
              onSubmitEditing={() => {
                if (parsedCustom !== null) onSelect(parsedCustom);
              }}
            />
            <Button
              title="Set"
              disabled={parsedCustom === null}
              onPress={() => {
                if (parsedCustom !== null) onSelect(parsedCustom);
              }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: color.scrim,
  },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: color.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: space.lg,
    paddingBottom: space.xxl,
    gap: space.md,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: color.hairlineStrong,
    marginBottom: space.xs,
  },
  label: { marginTop: space.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: {
    width: '22.6%',
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: color.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.hairline,
  },
  tileSelected: { borderColor: color.ink, backgroundColor: color.card },
  tileText: { fontSize: 22, fontWeight: '600', color: color.ink, ...tabularNums },
  tileTextSelected: { fontWeight: '700' },
  pressed: { opacity: 0.55 },
  customRow: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  customInput: {
    flex: 1,
    height: 56,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    backgroundColor: color.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.hairline,
    color: color.ink,
    ...type.input,
  },
});
