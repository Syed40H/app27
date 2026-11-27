import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { describePosition, type ExerciseHistory } from '@/domain/recall';
import { color, hitSlop, radius, space, tabularNums } from '@/theme/tokens';

/**
 * The position badge — the one thing no competitor does.
 *
 * It shows where this exercise sat in the last session that contained it, so
 * you know whether last time's numbers came from a fresh start or from four
 * exercises deep.
 *
 * The caller decides whether the badge exists at all (`positionBadge()` returns
 * `null` when the position matches, or when there is no history). This
 * component only renders one it has been given.
 */
export function PositionBadge({
  position,
  history,
  currentPosition,
  expanded,
  onToggle,
}: {
  /** Last session's position — already confirmed to differ from today's. */
  position: number;
  history: ExerciseHistory;
  currentPosition: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const fresher = currentPosition < position;

  return (
    <Pressable
      onPress={onToggle}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={`Was exercise ${position} last time. ${describePosition(
        history,
        currentPosition,
      )}`}
      style={({ pressed }) => [styles.badge, pressed && styles.pressed]}
    >
      {/* Today's position relative to last time: earlier in the session is
          "up" the running order, and means you should be fresher. */}
      <Ionicons name={fresher ? 'arrow-up' : 'arrow-down'} size={11} color={color.muted} />
      <Text style={styles.number}>{position}</Text>
    </Pressable>
  );
}

/**
 * The explanation behind the badge, revealed by tapping it. Rendered by the
 * exercise card rather than floating over the screen, so it never covers the
 * inputs the user is about to type into.
 */
export function PositionTooltip({
  history,
  currentPosition,
}: {
  history: ExerciseHistory;
  currentPosition: number;
}) {
  return (
    <View style={styles.tooltip} accessibilityRole="summary">
      <Text style={styles.tooltipText}>{describePosition(history, currentPosition)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: space.sm,
    height: 26,
    minWidth: 34,
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.hairlineStrong,
    backgroundColor: color.bg,
  },
  number: {
    fontSize: 13,
    fontWeight: '700',
    color: color.ink,
    ...tabularNums,
  },
  pressed: { opacity: 0.55 },
  tooltip: {
    marginTop: space.sm,
    padding: space.md,
    borderRadius: radius.sm,
    backgroundColor: color.bg,
  },
  tooltipText: {
    fontSize: 13,
    lineHeight: 18,
    color: color.muted,
  },
});
