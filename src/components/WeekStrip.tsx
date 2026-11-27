import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { WeekDay } from '@/domain/streak';
import { color, radius, space, tabularNums, type } from '@/theme/tokens';
import { Card } from './primitives';

/**
 * This week, at a glance: a filled dot per day trained, plus the run of
 * consecutive weeks behind it.
 *
 * The streak counts **weeks, not days**, because rest days are part of training
 * and a daily counter would punish following a programme correctly. Days later
 * in the week are drawn as outlines rather than misses — nothing is a miss until
 * it has actually passed.
 */
export function WeekStrip({
  days,
  streak,
  count,
}: {
  days: WeekDay[];
  /** Consecutive weeks with at least one workout. */
  streak: number;
  /** Workouts logged in the current week. */
  count: number;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.count}>
            {count} {count === 1 ? 'workout' : 'workouts'}
          </Text>
          <Text style={styles.label}>this week</Text>
        </View>

        {streak > 0 ? (
          <View style={styles.streak}>
            <Ionicons name="flame" size={15} color={color.accent} />
            <Text style={styles.streakText}>
              {streak} {streak === 1 ? 'week' : 'weeks'}
            </Text>
          </View>
        ) : null}
      </View>

      <View
        style={styles.strip}
        accessible
        accessibilityLabel={`Trained ${count} of the last 7 days. ${
          streak > 0 ? `${streak} week streak.` : ''
        }`}
      >
        {days.map((day) => (
          <View key={day.dayKey} style={styles.day}>
            <View
              style={[
                styles.dot,
                day.trained && styles.dotTrained,
                day.isToday && styles.dotToday,
                day.isFuture && styles.dotFuture,
              ]}
            >
              {day.trained ? <Ionicons name="checkmark" size={15} color="#FFFFFF" /> : null}
            </View>
            <Text style={[styles.letter, day.isToday && styles.letterToday]}>{day.letter}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.md, paddingVertical: space.lg },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  count: { fontSize: 22, fontWeight: '700', color: color.ink, ...tabularNums },
  label: { ...type.small, color: color.muted },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.md,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: color.accentWash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.accentEdge,
  },
  // A streak is the one place a personal-record-shaped celebration belongs, so
  // it borrows the accent rather than inventing another colour.
  streakText: { fontSize: 14, fontWeight: '700', color: color.accent, ...tabularNums },
  strip: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: space.xs, flex: 1 },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.hairlineStrong,
  },
  dotTrained: { backgroundColor: color.ink, borderColor: color.ink },
  dotToday: { borderWidth: 2, borderColor: color.ink },
  dotFuture: { borderStyle: 'dashed', opacity: 0.5 },
  letter: { fontSize: 11, fontWeight: '700', color: color.muted },
  letterToday: { color: color.ink },
});
