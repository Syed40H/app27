import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ghostForSet, positionBadge, type ExerciseHistory } from '@/domain/recall';
import type { Exercise, SessionEntry, Unit } from '@/domain/types';
import { color, space, type } from '@/theme/tokens';
import { ExerciseTile } from './ExerciseTile';
import { PositionBadge, PositionTooltip } from './PositionBadge';
import { Card, IconButton, Muted } from './primitives';
import { RepsPicker } from './RepsPicker';
import { SetRow } from './SetRow';

/**
 * One exercise within a session: the icon slot on the left, the sets on the
 * right, stacked in the order they were logged.
 *
 * The card grows as sets are added and the page scrolls, rather than scrolling
 * internally — a scroll view nested inside another one competing for the same
 * vertical drag is worse to use than a slightly longer page.
 */

/** Identifies which row the reps sheet was opened from. */
type RepsTarget = { kind: 'existing'; setId: string; reps: number } | { kind: 'new' } | null;

export function ExerciseCard({
  entry,
  exercise,
  position,
  history,
  unit,
  onAddSet,
  onPersistSet,
  onReload,
  onDeleteSet,
  onDeleteEntry,
  onOpenExercise,
}: {
  entry: SessionEntry;
  exercise: Exercise;
  /** 1-based position in today's session, derived from order. */
  position: number;
  history: ExerciseHistory | null;
  unit: Unit;
  onAddSet: (weightKg: number | null, reps: number) => void;
  /** Writes a set straight through to storage without re-reading the session. */
  onPersistSet: (setId: string, weightKg: number | null, reps: number) => void;
  /** Re-reads the session. Called once editing settles, not per keystroke. */
  onReload: () => void;
  onDeleteSet: (setId: string) => void;
  onDeleteEntry: () => void;
  onOpenExercise: () => void;
}) {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [repsTarget, setRepsTarget] = useState<RepsTarget>(null);
  /** Weight typed into the blank row before its reps have been chosen. */
  const [pendingWeightKg, setPendingWeightKg] = useState<number | null>(null);

  const badge = positionBadge(history, position);
  const nextIndex = entry.sets.length;

  function handleRepsSelected(reps: number) {
    if (repsTarget?.kind === 'existing') {
      const set = entry.sets.find((s) => s.id === repsTarget.setId);
      onPersistSet(repsTarget.setId, set?.weightKg ?? null, reps);
      onReload();
    } else if (repsTarget?.kind === 'new') {
      onAddSet(pendingWeightKg, reps);
      setPendingWeightKg(null);
    }
    setRepsTarget(null);
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Pressable
          onPress={onOpenExercise}
          accessibilityRole="button"
          accessibilityLabel={`View ${exercise.name} history`}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <ExerciseTile
            exerciseId={exercise.id}
            name={exercise.name}
            muscleGroup={exercise.muscleGroup}
            photoUri={exercise.photoUri}
            size={56}
          />
        </Pressable>

        <View style={styles.titleWrap}>
          <Text style={styles.name} numberOfLines={2}>
            {exercise.name}
          </Text>
          <Muted>
            {entry.sets.length === 0
              ? 'No sets yet'
              : `${entry.sets.length} ${entry.sets.length === 1 ? 'set' : 'sets'}`}
          </Muted>
        </View>

        {badge !== null && history ? (
          <PositionBadge
            position={badge}
            history={history}
            currentPosition={position}
            expanded={tooltipOpen}
            onToggle={() => setTooltipOpen((open) => !open)}
          />
        ) : null}

        <IconButton name="trash-outline" label={`Delete ${exercise.name}`} onPress={onDeleteEntry} />
      </View>

      {tooltipOpen && history ? (
        <PositionTooltip history={history} currentPosition={position} />
      ) : null}

      <View style={styles.sets}>
        {entry.sets.map((set, index) => (
          <SetRow
            key={set.id}
            number={index + 1}
            unit={unit}
            weightKg={set.weightKg}
            reps={set.reps}
            ghost={ghostForSet(history, index)}
            onChangeWeight={(weightKg) => onPersistSet(set.id, weightKg, set.reps)}
            onWeightCommitted={onReload}
            onPressReps={() =>
              setRepsTarget({ kind: 'existing', setId: set.id, reps: set.reps })
            }
            onDelete={() => onDeleteSet(set.id)}
          />
        ))}

        {/*
          The blank next set. It is the active row — one of the only three
          places the accent is allowed. Choosing reps is what commits it, so a
          weight typed here is held until then.
        */}
        <SetRow
          key={`new-${nextIndex}`}
          number={nextIndex + 1}
          unit={unit}
          weightKg={pendingWeightKg}
          reps={null}
          ghost={ghostForSet(history, nextIndex)}
          active
          onChangeWeight={setPendingWeightKg}
          onPressReps={() => setRepsTarget({ kind: 'new' })}
        />
      </View>

      <RepsPicker
        visible={repsTarget !== null}
        initial={repsTarget?.kind === 'existing' ? repsTarget.reps : null}
        onCancel={() => setRepsTarget(null)}
        onSelect={handleRepsSelected}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  titleWrap: { flex: 1, minWidth: 0, gap: 1 },
  name: { ...type.heading, color: color.ink },
  sets: { gap: space.xs },
  pressed: { opacity: 0.6 },
});
