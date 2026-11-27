import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExerciseCard } from '@/components/ExerciseCard';
import { ExercisePicker } from '@/components/ExercisePicker';
import { LabelPicker } from '@/components/LabelPicker';
import { Button, Loading, Muted } from '@/components/primitives';
import {
  addEntry,
  addSet,
  deleteEntry,
  deleteSet,
  findOrCreateExercise,
  finishSession,
  getExerciseHistory,
  getSession,
  listExercises,
  setSessionLabel,
  updateSet,
} from '@/db/queries';
import { formatDayKey, formatFullDate } from '@/domain/dayKey';
import type { ExerciseHistory } from '@/domain/recall';
import type { Exercise, Session } from '@/domain/types';
import { useUnit } from '@/state/settings';
import { useQuery } from '@/state/useQuery';
import { color, radius, space, type } from '@/theme/tokens';

/**
 * A single workout.
 *
 * Everything saves as it is entered, so an app kill mid-session loses nothing
 * and backing out leaves the session in progress rather than ending it.
 */

interface SessionData {
  session: Session | null;
  exercises: Exercise[];
  /** Keyed by exercise id — the last session each one appeared in. */
  histories: Map<string, ExerciseHistory | null>;
}

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const unit = useUnit();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [labelOpen, setLabelOpen] = useState(false);

  const { data, loading, reload } = useQuery<SessionData>(async () => {
    const session = await getSession(id);
    const exercises = await listExercises();

    const histories = new Map<string, ExerciseHistory | null>();
    if (session) {
      // One lookup per distinct exercise, not per entry — the same exercise
      // twice in a session shares the one comparison.
      const distinct = [...new Set(session.entries.map((e) => e.exerciseId))];
      await Promise.all(
        distinct.map(async (exerciseId) => {
          histories.set(exerciseId, await getExerciseHistory(exerciseId, session.id));
        }),
      );
    }

    return { session, exercises, histories };
  });

  const session = data?.session ?? null;
  const exercisesById = new Map((data?.exercises ?? []).map((e) => [e.id, e]));

  async function handlePick(exercise: Exercise) {
    setPickerOpen(false);
    if (!session) return;
    await addEntry(session.id, exercise.id);
    reload();
  }

  async function handleCreate(name: string) {
    setPickerOpen(false);
    if (!session) return;
    // A typed name that collides with an existing exercise matches to it
    // rather than creating a duplicate.
    const exercise = await findOrCreateExercise(name);
    await addEntry(session.id, exercise.id);
    reload();
  }

  async function handleFinish() {
    if (!session) return;
    const outcome = await finishSession(session.id);
    if (outcome === 'discarded') {
      Alert.alert('Nothing logged', 'This workout was empty, so it was not saved.');
    }
    router.back();
  }

  if (loading && !data) {
    return (
      <View style={styles.screen}>
        <Loading />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.screen}>
        <Muted style={styles.missing}>This workout no longer exists.</Muted>
      </View>
    );
  }

  const totalSets = session.entries.reduce((sum, entry) => sum + entry.sets.length, 0);

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          title: session.finishedAt === null ? 'In progress' : formatDayKey(session.dayKey),
        }}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xxl }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/*
          The workout's name is the headline and the date sits under it, which
          is how people actually refer to a session. Tapping the name is how you
          change it, so there is no separate control to hunt for.
        */}
        <Pressable
          onPress={() => setLabelOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={
            session.label ? `Workout name: ${session.label}. Tap to change.` : 'Name this workout'
          }
          style={({ pressed }) => [styles.headerRow, pressed && styles.pressed]}
        >
          <View style={styles.headerText}>
            <View style={styles.titleRow}>
              <Text style={session.label ? styles.title : styles.titleUnnamed} numberOfLines={1}>
                {session.label ?? formatDayKey(session.dayKey)}
              </Text>
              <Ionicons name="chevron-down" size={18} color={color.muted} />
            </View>
            <Muted style={styles.date}>{formatFullDate(session.dayKey)}</Muted>
            <Muted>
              {session.entries.length}{' '}
              {session.entries.length === 1 ? 'exercise' : 'exercises'} · {totalSets}{' '}
              {totalSets === 1 ? 'set' : 'sets'}
            </Muted>
          </View>
        </Pressable>

        {session.entries.map((entry) => {
          const exercise = exercisesById.get(entry.exerciseId);
          if (!exercise) return null;

          return (
            <ExerciseCard
              key={entry.id}
              entry={entry}
              exercise={exercise}
              // Position is derived from order at read time, so deleting an
              // earlier card renumbers everything below it automatically.
              position={entry.index + 1}
              history={data?.histories.get(entry.exerciseId) ?? null}
              unit={unit}
              onAddSet={async (weightKg, reps) => {
                await addSet(entry.id, weightKg, reps);
                reload();
              }}
              // Write-through only: the weight field re-reads on blur instead,
              // so typing a three-digit weight does not trigger three full
              // reloads of the session.
              onPersistSet={(setId, weightKg, reps) => {
                void updateSet(setId, weightKg, reps);
              }}
              onReload={reload}
              onDeleteSet={async (setId) => {
                await deleteSet(setId);
                reload();
              }}
              // No confirmation: deleting one exercise card is a small mistake
              // to make and an easy one to redo.
              onDeleteEntry={async () => {
                await deleteEntry(entry.id);
                reload();
              }}
              onOpenExercise={() => router.push(`/exercise/${entry.exerciseId}`)}
            />
          );
        })}

        <Pressable
          onPress={() => setPickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Add an exercise"
          style={({ pressed }) => [styles.addCard, pressed && styles.pressed]}
        >
          <Ionicons name="add" size={22} color={color.muted} />
          <Text style={styles.addText}>Add exercise</Text>
        </Pressable>

        {session.finishedAt === null ? (
          <View style={styles.finish}>
            <Button title="Finish workout" variant="accent" onPress={handleFinish} />
          </View>
        ) : null}
      </ScrollView>

      <ExercisePicker
        visible={pickerOpen}
        exercises={data?.exercises ?? []}
        onCancel={() => setPickerOpen(false)}
        onPick={handlePick}
        onCreate={handleCreate}
      />

      <LabelPicker
        visible={labelOpen}
        current={session.label}
        onCancel={() => setLabelOpen(false)}
        onSelect={async (label) => {
          setLabelOpen(false);
          await setSessionLabel(session.id, label);
          reload();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { padding: space.lg, gap: space.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  headerText: { flex: 1, minWidth: 0, gap: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  title: { ...type.title, fontSize: 30, color: color.ink, flexShrink: 1 },
  titleUnnamed: { ...type.title, fontSize: 30, color: color.ink, flexShrink: 1 },
  date: { fontSize: 15 },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: 64,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.hairlineStrong,
    borderStyle: 'dashed',
  },
  addText: { ...type.body, color: color.muted },
  finish: { marginTop: space.sm },
  missing: { textAlign: 'center', marginTop: space.xxl },
  pressed: { opacity: 0.6 },
});
