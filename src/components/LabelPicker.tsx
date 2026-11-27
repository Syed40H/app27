import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SESSION_LABELS } from '@/data/exercises';
import { color, radius, space } from '@/theme/tokens';
import { Button, SectionLabel } from './primitives';

/**
 * The session label: a dropdown of the common splits plus a type-in for
 * anything else. Purely a label — no logic anywhere depends on it.
 */
export function LabelPicker({
  visible,
  current,
  onCancel,
  onSelect,
}: {
  visible: boolean;
  current: string | null;
  onCancel: () => void;
  onSelect: (label: string | null) => void;
}) {
  const [custom, setCustom] = useState('');

  useEffect(() => {
    if (visible) {
      const isPreset = current !== null && SESSION_LABELS.includes(current);
      setCustom(isPreset || current === null ? '' : current);
    }
  }, [visible, current]);

  const trimmed = custom.trim();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable style={styles.scrim} onPress={onCancel} accessibilityLabel="Close label picker" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrap}
      >
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <SectionLabel>Workout label</SectionLabel>

          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {current !== null ? (
              <Pressable
                onPress={() => onSelect(null)}
                accessibilityRole="button"
                accessibilityLabel="Remove label"
                style={({ pressed }) => [styles.option, pressed && styles.pressed]}
              >
                <Text style={styles.optionTextMuted}>No label</Text>
              </Pressable>
            ) : null}

            {SESSION_LABELS.map((label) => {
              const selected = current === label;
              return (
                <Pressable
                  key={label}
                  onPress={() => onSelect(label)}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [styles.option, pressed && styles.pressed]}
                >
                  <Text style={styles.optionText}>{label}</Text>
                  {selected ? <Ionicons name="checkmark" size={19} color={color.ink} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>

          <SectionLabel>Or name it yourself</SectionLabel>
          <View style={styles.customRow}>
            <TextInput
              value={custom}
              onChangeText={setCustom}
              placeholder="Chest day"
              placeholderTextColor={color.ghost}
              style={styles.customInput}
              autoCapitalize="sentences"
              returnKeyType="done"
              maxLength={40}
              accessibilityLabel="Custom label"
              onSubmitEditing={() => trimmed !== '' && onSelect(trimmed)}
            />
            <Button title="Set" disabled={trimmed === ''} onPress={() => onSelect(trimmed)} />
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
    gap: space.sm,
    maxHeight: '82%',
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: color.hairlineStrong,
    marginBottom: space.xs,
  },
  list: { flexGrow: 0 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: space.xs,
  },
  optionText: { fontSize: 17, fontWeight: '600', color: color.ink },
  optionTextMuted: { fontSize: 17, fontWeight: '600', color: color.muted },
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
    fontSize: 18,
  },
});
