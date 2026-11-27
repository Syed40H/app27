import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SectionList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExerciseTile } from '@/components/ExerciseTile';
import { Card, Loading, Muted, SectionLabel, Title } from '@/components/primitives';
import { MUSCLE_GROUP_ORDER } from '@/data/exercises';
import { listPersonalRecords } from '@/db/queries';
import { formatDayKey, isWithinDays } from '@/domain/dayKey';
import type { MuscleGroup, PersonalRecord, Unit } from '@/domain/types';
import { formatWeight } from '@/domain/units';
import { workoutColor } from '@/domain/workoutColor';
import { useUnit } from '@/state/settings';
import { useQuery } from '@/state/useQuery';
import { color, mixHex, radius, space, tabularNums, type } from '@/theme/tokens';

/**
 * Records — every exercise logged, with its best lift.
 *
 * The point is motivation: a visible number to beat. Best is the heaviest
 * weight with the reps achieved at it, kept literal rather than turned into an
 * estimated 1RM.
 *
 * Bests set in the last fortnight wear an accent badge. That is one of the
 * three sanctioned uses of the accent — a new personal record — and it is what
 * makes this screen worth opening rather than a static table.
 */

/** How recently a best must have been set to still read as new. */
const FRESH_DAYS = 14;

export default function RecordsScreen() {
  const insets = useSafeAreaInsets();
  const unit = useUnit();
  const { data, loading } = useQuery<PersonalRecord[]>(() => listPersonalRecords());

  const records = data ?? [];
  const fresh = records.filter((r) => isWithinDays(r.dayKey, FRESH_DAYS));

  // The single heaviest lift across everything, for the headline stat.
  const heaviest = records.reduce<PersonalRecord | null>((best, record) => {
    if (record.weightKg === null) return best;
    if (best?.weightKg == null || record.weightKg > best.weightKg) return record;
    return best;
  }, null);

  const byGroup = new Map<MuscleGroup, PersonalRecord[]>();
  for (const record of records) {
    const list = byGroup.get(record.muscleGroup);
    if (list) list.push(record);
    else byGroup.set(record.muscleGroup, [record]);
  }

  const sections = MUSCLE_GROUP_ORDER.flatMap((group) => {
    const data = byGroup.get(group);
    return data && data.length > 0 ? [{ title: group, data }] : [];
  });

  return (
    <View style={styles.screen}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.exerciseId}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.xxl },
        ]}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={styles.head}>
            <Title>Records</Title>
            {records.length > 0 ? (
              <View style={styles.stats}>
                <Card style={styles.stat}>
                  <Text style={styles.statValue}>
                    {heaviest ? formatWeight(heaviest.weightKg ?? 0, unit) : '—'}
                  </Text>
                  <Muted style={styles.statLabel}>
                    heaviest {heaviest ? unit : 'lift'}
                  </Muted>
                </Card>

                <Card style={styles.stat}>
                  <Text style={styles.statValue}>{records.length}</Text>
                  <Muted style={styles.statLabel}>exercises</Muted>
                </Card>

                <Card style={[styles.stat, fresh.length > 0 && styles.statHot]}>
                  <Text style={[styles.statValue, fresh.length > 0 && styles.statValueHot]}>
                    {fresh.length}
                  </Text>
                  <Muted style={[styles.statLabel, fresh.length > 0 && styles.statLabelHot]}>
                    new
                  </Muted>
                </Card>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading && !data ? (
            <Loading />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="trophy-outline" size={34} color={color.muted} />
              <Muted style={styles.emptyText}>
                Finish a workout and your best lifts show up here.
              </Muted>
            </View>
          )
        }
        renderSectionHeader={({ section }) => (
          <SectionLabel style={styles.sectionHeader}>{section.title}</SectionLabel>
        )}
        renderItem={({ item }) => {
          const isFresh = isWithinDays(item.dayKey, FRESH_DAYS);
          const hue = workoutColor(null, item.muscleGroup);

          return (
            <Pressable
              onPress={() => router.push(`/exercise/${item.exerciseId}`)}
              accessibilityRole="button"
              accessibilityLabel={`${item.exerciseName}, best ${describeBest(item, unit)}${
                isFresh ? ', set recently' : ''
              }`}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <Card style={[styles.row, { borderLeftColor: hue }]}>
                <ExerciseTile
                  exerciseId={item.exerciseId}
                  name={item.exerciseName}
                  muscleGroup={item.muscleGroup}
                  photoUri={item.photoUri}
                  size={48}
                />

                <View style={styles.rowText}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.exerciseName}
                    </Text>
                    {isFresh ? (
                      <View style={styles.newPill}>
                        <Text style={styles.newPillText}>NEW</Text>
                      </View>
                    ) : null}
                  </View>
                  <Muted>{formatDayKey(item.dayKey)}</Muted>
                </View>

                <View style={styles.bestWrap}>
                  <Text style={styles.best}>{describeBestValue(item, unit)}</Text>
                  <Muted style={styles.bestUnit}>{describeBestSuffix(item, unit)}</Muted>
                </View>
              </Card>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

/** The big number: the weight, or the rep count for a bodyweight best. */
function describeBestValue(record: PersonalRecord, unit: Unit): string {
  if (record.weightKg === null) return String(record.reps);
  return formatWeight(record.weightKg, unit);
}

/** The small print under it — never "0 lb", which was never lifted. */
function describeBestSuffix(record: PersonalRecord, unit: Unit): string {
  if (record.weightKg === null) return record.reps === 1 ? 'rep' : 'reps';
  return `${unit} × ${record.reps}`;
}

function describeBest(record: PersonalRecord, unit: Unit): string {
  return `${describeBestValue(record, unit)} ${describeBestSuffix(record, unit)}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { paddingHorizontal: space.lg },
  head: { gap: space.md, marginBottom: space.sm },
  stats: { flexDirection: 'row', gap: space.sm },
  stat: { flex: 1, alignItems: 'center', paddingVertical: space.md, paddingHorizontal: space.xs },
  statHot: { backgroundColor: color.accentWash, borderWidth: 1, borderColor: color.accentEdge },
  statValue: { fontSize: 26, fontWeight: '700', color: color.ink, ...tabularNums },
  statValueHot: { color: color.accent },
  statLabel: { fontSize: 12 },
  statLabelHot: { color: color.accent },
  sectionHeader: { marginTop: space.lg, marginBottom: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, borderLeftWidth: 4 },
  rowText: { flex: 1, minWidth: 0, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  name: { fontSize: 17, fontWeight: '600', color: color.ink, flexShrink: 1 },
  newPill: {
    paddingHorizontal: space.sm,
    height: 20,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: mixHex(color.accent, '#FFFFFF', 0.86),
  },
  newPillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6, color: color.accent },
  bestWrap: { alignItems: 'flex-end' },
  best: { fontSize: 24, fontWeight: '700', color: color.ink, ...tabularNums },
  bestUnit: { fontSize: 12, ...tabularNums },
  empty: { alignItems: 'center', gap: space.md, marginTop: space.xxl },
  emptyText: { textAlign: 'center' },
  pressed: { opacity: 0.6 },
});
