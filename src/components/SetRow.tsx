import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import type { GhostSet } from '@/domain/recall';
import type { Unit } from '@/domain/types';
import { formatWeight, parseWeightInput } from '@/domain/units';
import { color, radius, space, tabularNums, type } from '@/theme/tokens';

/**
 * One logged set.
 *
 * Last time's numbers appear as faded ghost text inside the inputs. Tapping a
 * ghost pulls the number in and selects it, so the next keystroke types over it
 * — no extra screen, no popup.
 *
 * Every set is logged the same way. There is no warm-up flag and none should be
 * added: the known trade-off is that a warm-up logged as set 1 will ghost as
 * set 1 next time, which is accepted for the simplicity it buys.
 */

interface SetRowProps {
  /** 1-based number shown at the left of the row. */
  number: number;
  unit: Unit;
  weightKg: number | null;
  reps: number | null;
  ghost: GhostSet | null;
  /** The row being logged right now — the only place the accent appears here. */
  active?: boolean;
  onChangeWeight: (weightKg: number | null) => void;
  /**
   * Called when the weight field loses focus. Weight is written through on
   * every keystroke, but the screen only re-reads once editing stops — a
   * refetch per character would rebuild the whole session mid-entry.
   */
  onWeightCommitted?: () => void;
  onPressReps: () => void;
  onDelete?: () => void;
}

export function SetRow({
  number,
  unit,
  weightKg,
  reps,
  ghost,
  active = false,
  onChangeWeight,
  onWeightCommitted,
  onPressReps,
  onDelete,
}: SetRowProps) {
  const inputRef = useRef<TextInput>(null);
  const [text, setText] = useState(() => (weightKg === null ? '' : formatWeight(weightKg, unit)));
  const [focused, setFocused] = useState(false);

  // The stored value is the source of truth whenever the field is not being
  // edited, so a unit change or an external edit is reflected immediately. While
  // focused the raw keystrokes win, so typing "82.5" is never rounded mid-entry.
  const displayed = focused ? text : weightKg === null ? '' : formatWeight(weightKg, unit);

  const ghostWeight =
    ghost && ghost.weightKg !== null ? formatWeight(ghost.weightKg, unit) : null;

  function pullInGhost() {
    if (ghostWeight === null) return;
    setText(ghostWeight);
    onChangeWeight(parseWeightInput(ghostWeight, unit));
    void Haptics.selectionAsync();
    inputRef.current?.focus();
  }

  const row = (
    <View style={[styles.row, active && styles.rowActive]}>
      <Text style={[styles.number, active && styles.numberActive]}>{number}</Text>

      <View style={styles.weightWrap}>
        <TextInput
          ref={inputRef}
          value={displayed}
          onChangeText={(next) => {
            setText(next);
            onChangeWeight(parseWeightInput(next, unit));
          }}
          onFocus={() => {
            setText(weightKg === null ? '' : formatWeight(weightKg, unit));
            setFocused(true);
          }}
          onBlur={() => {
            setFocused(false);
            onWeightCommitted?.();
          }}
          keyboardType="decimal-pad"
          placeholder={ghostWeight ?? ''}
          placeholderTextColor={color.ghost}
          selectTextOnFocus
          style={styles.weightInput}
          accessibilityLabel={`Set ${number} weight in ${unit}`}
          returnKeyType="done"
        />

        {/*
          A placeholder cannot be tapped on its own, so an overlay covers the
          empty field and turns the ghost into the tap target the spec asks for.
          It only exists while the field is empty and unfocused.
        */}
        {ghostWeight !== null && displayed === '' && !focused ? (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={pullInGhost}
            accessibilityRole="button"
            accessibilityLabel={`Use last time's weight, ${ghostWeight} ${unit}`}
          />
        ) : null}
      </View>

      {/* The unit the user picked in Settings, shown on every row so there is
          never a bare number to second-guess mid-set. */}
      <Text style={styles.unit}>{unit}</Text>

      <Text style={styles.times}>×</Text>

      <Pressable
        onPress={onPressReps}
        style={({ pressed }) => [styles.repsButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={
          reps === null
            ? `Set ${number} reps, not set${ghost ? `, last time ${ghost.reps}` : ''}`
            : `Set ${number} reps, ${reps}`
        }
      >
        <Text style={[styles.reps, reps === null && styles.repsGhost]}>
          {reps ?? ghost?.reps ?? '—'}
        </Text>
        <Ionicons name="chevron-down" size={13} color={color.muted} />
      </Pressable>
    </View>
  );

  if (!onDelete) return row;

  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={36}
      renderRightActions={() => (
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onDelete();
          }}
          style={styles.deleteAction}
          accessibilityRole="button"
          accessibilityLabel={`Delete set ${number}`}
        >
          <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
        </Pressable>
      )}
    >
      {row}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.xs,
    paddingLeft: space.sm,
    backgroundColor: color.card,
    borderRadius: radius.sm,
  },
  rowActive: { backgroundColor: color.accentWash },
  number: {
    width: 20,
    fontSize: 13,
    fontWeight: '700',
    color: color.muted,
    ...tabularNums,
  },
  numberActive: { color: color.accent },
  weightWrap: { flex: 1, minWidth: 0 },
  repsWrap: { minWidth: 0 },
  weightInput: {
    height: 52,
    paddingHorizontal: space.sm,
    borderRadius: radius.sm,
    color: color.ink,
    ...type.input,
  },
  unit: { fontSize: 14, fontWeight: '600', color: color.muted },
  times: { fontSize: 15, color: color.muted },
  repsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minWidth: 86,
    height: 52,
    paddingHorizontal: space.md,
    justifyContent: 'flex-end',
  },
  reps: { ...type.input, color: color.ink },
  repsGhost: { color: color.ghost },
  pressed: { opacity: 0.55 },
  deleteAction: {
    width: 76,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.danger,
    borderRadius: radius.sm,
    marginLeft: space.sm,
  },
});
