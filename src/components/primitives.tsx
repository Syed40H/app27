import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  type TextProps,
  View,
  type ViewProps,
} from 'react-native';

import { cardShadow, color, hitSlop, HIT_SIZE, radius, space, type } from '@/theme/tokens';

/** Shared building blocks: card, text styles, buttons, section labels. */

export function Card({ style, ...props }: ViewProps) {
  return <View {...props} style={[styles.card, style]} />;
}

export function Title({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.title, style]} />;
}

export function Heading({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.heading, style]} />;
}

export function Body({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.body, style]} />;
}

export function Muted({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.muted, style]} />;
}

/** Uppercased section label — "RECENT", "CHEST". */
export function SectionLabel({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.sectionLabel, style]} />;
}

export function Numeral({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.numeral, style]} />;
}

/** A hairline divider. */
export function Divider({ style, ...props }: ViewProps) {
  return <View {...props} style={[styles.divider, style]} />;
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface IconButtonProps extends Omit<PressableProps, 'style'> {
  name: IconName;
  size?: number;
  tint?: string;
  /** Visually hidden label. Every icon-only control needs one. */
  label: string;
}

export function IconButton({
  name,
  size = 20,
  tint = color.muted,
  label,
  ...props
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={hitSlop}
      {...props}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      <Ionicons name={name} size={size} color={tint} />
    </Pressable>
  );
}

interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  title: string;
  /**
   * `accent` is reserved for Finish Workout. Everything else is `plain` or
   * `danger` — see `accentUse` in the theme.
   */
  variant?: 'plain' | 'accent' | 'danger';
  icon?: IconName;
  loading?: boolean;
}

export function Button({
  title,
  variant = 'plain',
  icon,
  loading = false,
  disabled,
  onPress,
  ...props
}: ButtonProps) {
  const isAccent = variant === 'accent';
  const tint = isAccent ? '#FFFFFF' : variant === 'danger' ? color.danger : color.ink;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={(event) => {
        if (isAccent) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress?.(event);
      }}
      {...props}
      style={({ pressed }) => [
        styles.button,
        isAccent && styles.buttonAccent,
        variant === 'danger' && styles.buttonDanger,
        pressed && styles.pressed,
        (disabled || loading) && styles.buttonDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tint} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={tint} /> : null}
          <Text style={[styles.buttonText, { color: tint }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

/** Centred message for a screen with nothing in it yet. */
export function EmptyState({ line, hint }: { line: string; hint?: string }) {
  return (
    <View style={styles.empty}>
      <Body style={styles.emptyLine}>{line}</Body>
      {hint ? <Muted style={styles.emptyHint}>{hint}</Muted> : null}
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={color.muted} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.card,
    borderRadius: radius.lg,
    padding: space.lg,
    ...cardShadow,
  },
  title: { ...type.title, color: color.ink },
  heading: { ...type.heading, color: color.ink },
  body: { ...type.body, color: color.ink },
  muted: { ...type.small, color: color.muted },
  sectionLabel: { ...type.label, color: color.muted, textTransform: 'uppercase' },
  numeral: { ...type.numeral, color: color.ink },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: color.hairlineStrong },
  iconButton: {
    minWidth: HIT_SIZE,
    minHeight: HIT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  pressed: { opacity: 0.55 },
  button: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingHorizontal: space.xl,
    borderRadius: radius.md,
    backgroundColor: color.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.hairlineStrong,
  },
  buttonAccent: { backgroundColor: color.accent, borderColor: color.accent },
  buttonDanger: { borderColor: color.danger },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { fontSize: 17, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: space.xxl, gap: space.xs },
  emptyLine: { color: color.muted },
  emptyHint: { textAlign: 'center' },
  loading: { paddingVertical: space.xxl, alignItems: 'center' },
});
