import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { MUSCLE_GROUP_ORDER } from '@/data/exercises';
import { nameKey } from '@/db/client';
import { searchByName } from '@/domain/search';
import type { Exercise, MuscleGroup } from '@/domain/types';
import { color, radius, space, type } from '@/theme/tokens';
import { ExerciseTile } from './ExerciseTile';
import { Muted, SectionLabel } from './primitives';

/**
 * Choosing an exercise.
 *
 * Ordered for the 90% case: Recent sits above everything, because people repeat
 * the same lifts and the right answer is usually one tap with no typing. The
 * search field is pinned but deliberately **not** autofocused — raising the
 * keyboard would bury the recents that most taps land on.
 */

/** How many recents to surface. Roughly one session's worth of exercises. */
const RECENT_LIMIT = 8;

interface Section {
  title: string;
  data: Exercise[];
}

export function ExercisePicker({
  visible,
  exercises,
  onCancel,
  onPick,
  onCreate,
}: {
  visible: boolean;
  exercises: Exercise[];
  onCancel: () => void;
  onPick: (exercise: Exercise) => void;
  /** Called with a typed name that matches nothing in the list. */
  onCreate: (name: string) => void;
}) {
  const [query, setQuery] = useState('');

  const sections = useMemo<Section[]>(() => {
    const matches = searchByName(exercises, query, (e) => e.name);

    if (query.trim() !== '') {
      return [{ title: 'Results', data: matches }];
    }

    const recent = exercises
      .filter((e) => e.lastUsedAt !== null)
      .sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0))
      .slice(0, RECENT_LIMIT);

    const byGroup = new Map<MuscleGroup, Exercise[]>();
    for (const exercise of exercises) {
      const list = byGroup.get(exercise.muscleGroup);
      if (list) list.push(exercise);
      else byGroup.set(exercise.muscleGroup, [exercise]);
    }

    const grouped: Section[] = MUSCLE_GROUP_ORDER.flatMap((group) => {
      const data = byGroup.get(group);
      return data && data.length > 0 ? [{ title: group, data }] : [];
    });

    return recent.length > 0 ? [{ title: 'Recent', data: recent }, ...grouped] : grouped;
  }, [exercises, query]);

  const trimmed = query.trim();
  // Offer to create only when the typed name is not already an exercise —
  // a name that collides is matched to the existing one instead.
  const canCreate =
    trimmed !== '' && !exercises.some((e) => nameKey(e.name) === nameKey(trimmed));

  function reset() {
    setQuery('');
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel} presentationStyle="pageSheet">
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add exercise</Text>
          <Pressable
            onPress={() => {
              reset();
              onCancel();
            }}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={17} color={color.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search exercises"
            placeholderTextColor={color.muted}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="words"
            returnKeyType="search"
            clearButtonMode="while-editing"
            accessibilityLabel="Search exercises"
          />
        </View>

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            canCreate ? (
              <Pressable
                onPress={() => {
                  onCreate(trimmed);
                  reset();
                }}
                accessibilityRole="button"
                accessibilityLabel={`Create exercise ${trimmed}`}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <View style={styles.createIcon}>
                  <Ionicons name="add" size={22} color={color.ink} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    Create “{trimmed}”
                  </Text>
                  <Muted>Saved for next time</Muted>
                </View>
              </Pressable>
            ) : null
          }
          renderSectionHeader={({ section }) => (
            <SectionLabel style={styles.sectionHeader}>{section.title}</SectionLabel>
          )}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                onPick(item);
                reset();
              }}
              accessibilityRole="button"
              accessibilityLabel={item.name}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <ExerciseTile
                exerciseId={item.id}
                name={item.name}
                muscleGroup={item.muscleGroup}
                photoUri={item.photoUri}
                size={42}
              />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <Muted>{item.muscleGroup}</Muted>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            canCreate ? null : (
              <Muted style={styles.emptyText}>No exercises match “{trimmed}”.</Muted>
            )
          }
          stickySectionHeadersEnabled={false}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.sm,
  },
  headerTitle: { ...type.heading, color: color.ink },
  cancel: { minHeight: 44, justifyContent: 'center', paddingLeft: space.lg },
  cancelText: { fontSize: 16, color: color.muted, fontWeight: '600' },
  pressed: { opacity: 0.55 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginHorizontal: space.lg,
    marginBottom: space.sm,
    paddingHorizontal: space.md,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: color.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.hairline,
  },
  searchInput: { flex: 1, fontSize: 17, color: color.ink },
  listContent: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  sectionHeader: { marginTop: space.lg, marginBottom: space.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
    minHeight: 60,
  },
  rowPressed: { opacity: 0.55 },
  rowText: { flex: 1, minWidth: 0, gap: 1 },
  rowTitle: { fontSize: 17, fontWeight: '600', color: color.ink },
  createIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.hairlineStrong,
    borderStyle: 'dashed',
  },
  emptyText: { textAlign: 'center', marginTop: space.xl },
});
