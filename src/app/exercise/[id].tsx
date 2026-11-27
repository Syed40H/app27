import { Stack, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ExerciseTile } from '@/components/ExerciseTile';
import { Button, Card, Loading, Muted, SectionLabel } from '@/components/primitives';
import { getExercise, getExerciseDetail, setExercisePhoto, type ExerciseAppearance } from '@/db/queries';
import { formatDayKey } from '@/domain/dayKey';
import { ordinal } from '@/domain/recall';
import type { Exercise, PersonalRecord } from '@/domain/types';
import { formatSet, formatWeight } from '@/domain/units';
import { captureExercisePhoto, deletePhotoFile } from '@/media/photos';
import { useUnit } from '@/state/settings';
import { useQuery } from '@/state/useQuery';
import { color, space, tabularNums, type } from '@/theme/tokens';

/**
 * One exercise: its all-time best, and the last 3 sessions it appeared in with
 * the position it held in each.
 *
 * This is the only place the "last 3" rule surfaces. Nothing older has been
 * deleted — it is all still in History.
 */

interface DetailData {
  exercise: Exercise | null;
  best: PersonalRecord | null;
  appearances: ExerciseAppearance[];
}

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const unit = useUnit();

  const { data, loading, reload } = useQuery<DetailData>(async () => {
    const exercise = await getExercise(id);
    const { best, appearances } = await getExerciseDetail(id);
    return { exercise, best, appearances };
  });

  const exercise = data?.exercise ?? null;

  async function handlePhoto() {
    if (!exercise) return;
    const uri = await captureExercisePhoto();
    if (!uri) return;
    // The old file is only removed once the new one is safely stored.
    const previous = exercise.photoUri;
    await setExercisePhoto(exercise.id, uri);
    deletePhotoFile(previous);
    reload();
  }

  function handleRemovePhoto() {
    if (!exercise?.photoUri) return;
    Alert.alert('Remove photo?', `${exercise.name} will go back to its drawn icon.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const previous = exercise.photoUri;
          await setExercisePhoto(exercise.id, null);
          deletePhotoFile(previous);
          reload();
        },
      },
    ]);
  }

  if (loading && !data) {
    return (
      <View style={styles.screen}>
        <Loading />
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={styles.screen}>
        <Muted style={styles.missing}>This exercise no longer exists.</Muted>
      </View>
    );
  }

  const best = data?.best ?? null;
  const appearances = data?.appearances ?? [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: exercise.name }} />

      <View style={styles.header}>
        <ExerciseTile
          exerciseId={exercise.id}
          name={exercise.name}
          muscleGroup={exercise.muscleGroup}
          photoUri={exercise.photoUri}
          size={88}
        />
        <View style={styles.headerText}>
          <Text style={styles.name}>{exercise.name}</Text>
          <Muted>{exercise.muscleGroup}</Muted>
        </View>
      </View>

      <Card>
        <SectionLabel>All-time best</SectionLabel>
        {best ? (
          <>
            <Text style={styles.best}>
              {best.weightKg === null
                ? `${best.reps} reps`
                : `${formatWeight(best.weightKg, unit)} ${unit} × ${best.reps}`}
            </Text>
            <Muted>{formatDayKey(best.dayKey)}</Muted>
          </>
        ) : (
          <Muted style={styles.bestEmpty}>
            No completed sets yet. Finish a workout with this exercise to set one.
          </Muted>
        )}
      </Card>

      <SectionLabel style={styles.sectionSpacing}>Last {appearances.length || 3} sessions</SectionLabel>

      {appearances.length === 0 ? (
        <Muted>This exercise has not been logged in a finished workout yet.</Muted>
      ) : (
        appearances.map((appearance) => (
          <Card key={appearance.sessionId} style={styles.appearance}>
            <View style={styles.appearanceHeader}>
              <Text style={styles.appearanceDate}>{formatDayKey(appearance.dayKey)}</Text>
              <Muted>
                {ordinal(appearance.position)} of {appearance.totalExercises}
              </Muted>
            </View>

            <View style={styles.setList}>
              {appearance.sets.map((set, index) => (
                <View key={index} style={styles.setLine}>
                  <Text style={styles.setNumber}>{index + 1}</Text>
                  <Text style={styles.setValue}>{formatSet(set.weightKg, set.reps, unit)}</Text>
                </View>
              ))}
            </View>
          </Card>
        ))
      )}

      {/*
        Photos are attached here rather than mid-workout: once a photo is set
        for a name it sticks to that name forever, so it is a decision worth
        making away from the machine.
      */}
      <View style={styles.photoActions}>
        <Button
          title={exercise.photoUri ? 'Replace photo' : 'Add a photo'}
          icon="camera-outline"
          onPress={handlePhoto}
        />
        {exercise.photoUri ? (
          <Button title="Remove photo" variant="danger" onPress={handleRemovePhoto} />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  headerText: { flex: 1, minWidth: 0, gap: 2 },
  name: { ...type.title, fontSize: 24, color: color.ink },
  best: { fontSize: 34, fontWeight: '700', color: color.ink, marginTop: space.xs, ...tabularNums },
  bestEmpty: { marginTop: space.xs },
  sectionSpacing: { marginTop: space.md },
  appearance: { gap: space.sm },
  appearanceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  appearanceDate: { ...type.heading, color: color.ink },
  setList: { gap: space.xs },
  setLine: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  setNumber: { width: 18, ...type.small, color: color.muted, ...tabularNums },
  setValue: { ...type.numeral, color: color.ink },
  photoActions: { gap: space.sm, marginTop: space.md },
  missing: { textAlign: 'center', marginTop: space.xxl },
});
