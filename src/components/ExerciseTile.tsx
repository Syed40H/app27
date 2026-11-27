import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Polyline, Rect, Stop } from 'react-native-svg';

import { pictogramFor } from '@/data/exerciseArt';
import { PICTOGRAMS, PICTOGRAM_BOX, PICTOGRAM_STROKE, type Primitive } from '@/data/pictograms';
import { monogramTint } from '@/domain/monogram';
import type { MuscleGroup } from '@/domain/types';
import { color, mixHex, radius } from '@/theme/tokens';

/**
 * The exercise icon slot.
 *
 * Three tiers, in order: the user's own photo, the drawn pictogram for the
 * movement, and the tinted tile alone. There is no empty or grey state once an
 * exercise is selected.
 *
 * The art is given depth by drawing it three times — a darker copy pushed
 * down-right to read as thickness, the ink itself, then a fine light pass along
 * the top-left edge. Flat line work looks like a diagram; extruded line work
 * looks like an object. `scripts/preview-pictograms.js` renders these same
 * passes to a PNG so the result can be checked rather than imagined.
 */

/** Matches the passes in `scripts/preview-pictograms.js`. Keep them in step. */
const PASSES = [
  { dx: 1.15, dy: 1.45, width: PICTOGRAM_STROKE, tone: 'shadow' as const, opacity: 0.9 },
  { dx: 0, dy: 0, width: PICTOGRAM_STROKE, tone: 'ink' as const, opacity: 1 },
  { dx: -0.5, dy: -0.7, width: PICTOGRAM_STROKE * 0.38, tone: 'light' as const, opacity: 0.75 },
];

/** Below this the extrusion turns to mud, so small tiles draw ink only. */
const MIN_SIZE_FOR_DEPTH = 30;

export function ExerciseTile({
  exerciseId,
  name,
  muscleGroup,
  photoUri,
  size = 52,
}: {
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup;
  photoUri?: string | null;
  size?: number;
}) {
  const dimensions = {
    width: size,
    height: size,
    borderRadius: size >= 44 ? radius.md : radius.sm,
  };

  if (photoUri) {
    return (
      <Image
        source={{ uri: photoUri }}
        style={[styles.tile, dimensions]}
        contentFit="cover"
        transition={120}
        accessibilityIgnoresInvertColors
        accessible
        accessibilityLabel={`Photo of ${name}`}
      />
    );
  }

  const tint = monogramTint(name);
  const light = mixHex(tint, '#FFFFFF', 0.55);
  const deep = mixHex(tint, color.ink, 0.1);
  const shadow = mixHex(tint, color.ink, 0.5);

  // Gradients are identical for a given tint, so keying the id by the colour
  // keeps them shareable and stable across re-renders.
  const gradientId = `tile${tint.replace('#', '')}`;

  const primitives = PICTOGRAMS[pictogramFor(exerciseId, name, muscleGroup)];
  const passes = size >= MIN_SIZE_FOR_DEPTH ? PASSES : PASSES.filter((p) => p.tone === 'ink');

  return (
    <View style={[styles.tile, dimensions]} accessible accessibilityLabel={name}>
      <Svg width={size} height={size} viewBox={`0 0 ${PICTOGRAM_BOX} ${PICTOGRAM_BOX}`}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0.6" y2="1">
            <Stop offset="0" stopColor={light} />
            <Stop offset="1" stopColor={deep} />
          </LinearGradient>
        </Defs>

        <Rect
          x={0}
          y={0}
          width={PICTOGRAM_BOX}
          height={PICTOGRAM_BOX}
          rx={PICTOGRAM_BOX * 0.22}
          fill={`url(#${gradientId})`}
        />

        {passes.map((pass) => (
          <G
            key={pass.tone}
            x={pass.dx}
            y={pass.dy}
            opacity={pass.opacity}
            stroke={pass.tone === 'ink' ? color.ink : pass.tone === 'shadow' ? shadow : '#FFFFFF'}
            strokeWidth={pass.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          >
            {primitives.map((primitive, index) => (
              <Shape key={index} primitive={primitive} />
            ))}
          </G>
        ))}
      </Svg>
    </View>
  );
}

/** Stroke colour and width are inherited from the enclosing pass group. */
function Shape({ primitive }: { primitive: Primitive }) {
  switch (primitive.k) {
    case 'line':
      return (
        <Line x1={primitive.x1} y1={primitive.y1} x2={primitive.x2} y2={primitive.y2} />
      );
    case 'circle':
      return <Circle cx={primitive.cx} cy={primitive.cy} r={primitive.r} />;
    case 'poly':
      return <Polyline points={primitive.pts.join(',')} />;
  }
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
});
