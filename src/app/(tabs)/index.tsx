import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SessionCard } from '@/components/SessionCard';
import { WeekStrip } from '@/components/WeekStrip';
import { Loading, Muted, SectionLabel, Title } from '@/components/primitives';
import {
  createSession,
  deleteSession,
  getInProgressSessionId,
  listFinishedSessions,
  listTrainedDayKeys,
} from '@/db/queries';
import { weekDays, weeklyStreak, workoutsThisWeek } from '@/domain/streak';
import type { SessionSummary } from '@/domain/types';
import { useQuery } from '@/state/useQuery';
import { color, radius, space, type } from '@/theme/tokens';

/**
 * Workouts — the main page, and the default tab.
 *
 * The previous session is the first thing on screen, because the first question
 * anyone opens this app with is "what did I do last time".
 */

/** Cards shown under the featured one before "See all" takes over. */
const RECENT_COUNT = 3;

interface HomeData {
  inProgressId: string | null;
  sessions: SessionSummary[];
  /** Local days that have a finished workout, for the week strip and streak. */
  trainedDays: string[];
}

export default function WorkoutsScreen() {
  const insets = useSafeAreaInsets();

  const { data, loading, reload } = useQuery<HomeData>(async () => ({
    inProgressId: await getInProgressSessionId(),
    // One more than shown, to know whether "See all" is worth offering.
    sessions: await listFinishedSessions(RECENT_COUNT + 2),
    trainedDays: await listTrainedDayKeys(),
  }));

  const inProgressId = data?.inProgressId ?? null;
  const sessions = data?.sessions ?? [];
  const [previous, ...older] = sessions;
  const recent = older.slice(0, RECENT_COUNT);
  const hasMore = older.length > RECENT_COUNT;

  const trainedDays = data?.trainedDays ?? [];
  const trained = new Set(trainedDays);

  async function startEmptySession() {
    const id = await createSession();
    router.push(`/session/${id}`);
  }

  async function handleDelete(id: string) {
    await deleteSession(id);
    reload();
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.md, paddingBottom: insets.bottom + 120 },
        ]}
      >
        <Title style={styles.title}>Workouts</Title>

        {loading && !data ? (
          <Loading />
        ) : previous === undefined ? (
          <View style={styles.empty}>
            <Text style={styles.emptyLine}>Log your first workout.</Text>
          </View>
        ) : (
          <>
            <WeekStrip
              days={weekDays(trained)}
              streak={weeklyStreak(trained)}
              count={workoutsThisWeek(trainedDays)}
            />

            <SectionLabel style={styles.section}>Last workout</SectionLabel>

            <SessionCard
              session={previous}
              featured
              onOpen={() => router.push(`/session/${previous.id}`)}
              onDelete={() => void handleDelete(previous.id)}
            />

            {recent.length > 0 ? (
              <View style={styles.recent}>
                <SectionLabel style={styles.section}>Before that</SectionLabel>
                {recent.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onOpen={() => router.push(`/session/${session.id}`)}
                    onDelete={() => void handleDelete(session.id)}
                  />
                ))}
              </View>
            ) : null}

            {hasMore || recent.length > 0 ? (
              <Pressable
                onPress={() => router.push('/history')}
                accessibilityRole="button"
                accessibilityLabel="See all workouts"
                style={({ pressed }) => [styles.seeAll, pressed && styles.pressed]}
              >
                <Muted style={styles.seeAllText}>See all</Muted>
                <Ionicons name="chevron-forward" size={15} color={color.muted} />
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>

      {/*
        Reads as an invitation either way. Gyms are full of interruptions, so
        walking away mid-session must never look like an ending — an open
        workout is something to keep going, not something to recover.
      */}
      <Pressable
        onPress={() =>
          inProgressId ? router.push(`/session/${inProgressId}`) : void startEmptySession()
        }
        accessibilityRole="button"
        accessibilityLabel={inProgressId ? 'Keep going with your open workout' : 'Start a new session'}
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + space.lg },
          pressed && styles.pressed,
        ]}
      >
        <Ionicons name={inProgressId ? 'arrow-forward' : 'add'} size={20} color="#FFFFFF" />
        <Text style={styles.fabText}>{inProgressId ? 'Keep going' : 'New session'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { paddingHorizontal: space.lg, gap: space.md },
  title: { marginBottom: space.xs },
  empty: { paddingVertical: space.xxl, alignItems: 'center' },
  emptyLine: { ...type.body, color: color.muted },
  recent: { gap: space.md },
  section: { marginTop: space.sm },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    minHeight: 48,
  },
  seeAllText: { fontWeight: '600' },
  pressed: { opacity: 0.6 },
  fab: {
    position: 'absolute',
    right: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    height: 60,
    minWidth: 60,
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    backgroundColor: color.ink,
    shadowColor: '#1A1A1A',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  fabText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
