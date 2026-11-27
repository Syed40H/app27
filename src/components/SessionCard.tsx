import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDayKey, formatFullDate } from '@/domain/dayKey';
import type { SessionSummary } from '@/domain/types';
import { workoutColor } from '@/domain/workoutColor';
import { color, hitSlop, mixHex, radius, space, tabularNums, type } from '@/theme/tokens';
import { ExerciseTile } from './ExerciseTile';
import { Card, IconButton, Muted } from './primitives';

/**
 * A completed workout, as it appears on the Workouts tab and in History.
 *
 * The workout's **name** is the headline — "Push", "Legs" — with the date
 * underneath, because that is how people refer to a session. An unlabelled one
 * falls back to the friendly day ("Today"), so the headline is never blank.
 *
 * Each card carries the colour of its split down the left edge, so a stack of
 * them is scannable without reading. The colour is derived, never random: the
 * same split is always the same colour. See `domain/workoutColor.ts`.
 *
 * Deleting a whole workout asks first; unlike removing a single exercise, it is
 * not a small thing to undo.
 */

/** Tiles shown before the strip collapses into a "+N". */
const TILE_LIMIT = 5;

export function SessionCard({
  session,
  onOpen,
  onDelete,
  /** Marks the headline card at the top of the Workouts tab. */
  featured = false,
}: {
  session: SessionSummary;
  onOpen: () => void;
  onDelete: () => void;
  featured?: boolean;
}) {
  const title = session.label ?? formatDayKey(session.dayKey);
  const hue = workoutColor(session.label, session.exercises[0]?.muscleGroup);
  const shown = session.exercises.slice(0, TILE_LIMIT);
  const overflow = session.exercises.length - shown.length;

  function confirmDelete() {
    Alert.alert(
      'Delete this workout?',
      `${title} · ${formatFullDate(session.dayKey)}. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ],
    );
  }

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`Open ${title}, ${formatFullDate(session.dayKey)}`}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <Card
        style={[
          styles.card,
          { borderLeftColor: hue },
          featured && styles.featured,
          featured && { backgroundColor: mixHex(hue, '#FFFFFF', 0.94) },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={featured ? styles.titleFeatured : styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Muted style={styles.date}>{formatFullDate(session.dayKey)}</Muted>
          </View>

          <IconButton
            name="trash-outline"
            label="Delete workout"
            onPress={confirmDelete}
            hitSlop={hitSlop}
          />
        </View>

        {shown.length > 0 ? (
          <View style={styles.strip}>
            {shown.map((exercise, index) => (
              <ExerciseTile
                key={`${exercise.id}-${index}`}
                exerciseId={exercise.id}
                name={exercise.name}
                muscleGroup={exercise.muscleGroup}
                photoUri={exercise.photoUri}
                size={featured ? 48 : 40}
              />
            ))}
            {overflow > 0 ? (
              <View style={[styles.overflow, { height: featured ? 48 : 40 }]}>
                <Text style={styles.overflowText}>+{overflow}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.footer}>
          <View style={[styles.pill, { backgroundColor: mixHex(hue, '#FFFFFF', 0.88) }]}>
            <Text style={[styles.pillText, { color: hue }]}>
              {session.exerciseCount} {session.exerciseCount === 1 ? 'exercise' : 'exercises'}
            </Text>
          </View>
          <View style={[styles.pill, { backgroundColor: mixHex(hue, '#FFFFFF', 0.88) }]}>
            <Text style={[styles.pillText, { color: hue }]}>
              {session.setCount} {session.setCount === 1 ? 'set' : 'sets'}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderLeftWidth: 5 },
  featured: { paddingVertical: space.xl },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  headerText: { flex: 1, minWidth: 0 },
  title: { ...type.heading, fontSize: 21, color: color.ink },
  titleFeatured: { ...type.title, fontSize: 30, color: color.ink },
  date: { marginTop: 2 },
  strip: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.md },
  overflow: {
    minWidth: 40,
    paddingHorizontal: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: color.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.hairline,
  },
  overflowText: { fontSize: 13, fontWeight: '700', color: color.muted },
  footer: { flexDirection: 'row', gap: space.xs, marginTop: space.md },
  pill: {
    paddingHorizontal: space.md,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: { fontSize: 13, fontWeight: '700', ...tabularNums },
  pressed: { opacity: 0.6 },
});
