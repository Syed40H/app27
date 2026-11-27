import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SessionCard } from '@/components/SessionCard';
import { Muted, SectionLabel } from '@/components/primitives';
import { deleteSession, listFinishedSessions } from '@/db/queries';
import { formatMonthKey } from '@/domain/dayKey';
import type { SessionSummary } from '@/domain/types';
import { color, space } from '@/theme/tokens';

/**
 * History — every session ever logged, newest first, grouped by month.
 *
 * Nothing is ever pruned. The main page only pages older sessions out of view;
 * this is where they all still live.
 */

/** Rows per fetch. Small enough to stay instant, large enough to fill a screen. */
const PAGE_SIZE = 20;

interface MonthSection {
  title: string;
  data: SessionSummary[];
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [exhausted, setExhausted] = useState(false);
  const [loading, setLoading] = useState(true);
  /** Prevents overlapping page loads while a fetch is already in flight. */
  const fetching = useRef(false);

  /** How many rows are on screen, so a refresh can re-read exactly those. */
  const loadedCount = useRef(0);
  loadedCount.current = sessions.length;

  const loadMore = useCallback(async (offset: number) => {
    if (fetching.current) return;
    fetching.current = true;
    try {
      const page = await listFinishedSessions(PAGE_SIZE, offset);
      setSessions((current) => [...current, ...page]);
      setExhausted(page.length < PAGE_SIZE);
    } catch (error) {
      console.error('[repa] failed to load history', error);
    } finally {
      fetching.current = false;
      setLoading(false);
    }
  }, []);

  /**
   * Re-read every row already loaded, rather than resetting to the first page.
   * Editing a session and coming back must not throw away the user's scroll
   * position in a list that can be years long.
   */
  const refresh = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    try {
      const limit = Math.max(PAGE_SIZE, loadedCount.current);
      const page = await listFinishedSessions(limit, 0);
      setSessions(page);
      setExhausted(page.length < limit);
    } catch (error) {
      console.error('[repa] failed to load history', error);
    } finally {
      fetching.current = false;
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  async function handleDelete(id: string) {
    await deleteSession(id);
    setSessions((current) => current.filter((s) => s.id !== id));
  }

  const sections: MonthSection[] = [];
  for (const session of sessions) {
    const title = formatMonthKey(session.dayKey);
    const last = sections[sections.length - 1];
    if (last && last.title === title) last.data.push(session);
    else sections.push({ title, data: [session] });
  }

  return (
    <SectionList
      style={styles.screen}
      sections={sections}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xxl }]}
      stickySectionHeadersEnabled={false}
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (!exhausted && !fetching.current) void loadMore(sessions.length);
      }}
      renderSectionHeader={({ section }) => (
        <SectionLabel style={styles.month}>{section.title}</SectionLabel>
      )}
      renderItem={({ item }) => (
        <View style={styles.cardWrap}>
          <SessionCard
            session={item}
            onOpen={() => router.push(`/session/${item.id}`)}
            onDelete={() => void handleDelete(item.id)}
          />
        </View>
      )}
      ListEmptyComponent={
        loading ? null : <Muted style={styles.empty}>No workouts logged yet.</Muted>
      }
      ListFooterComponent={
        !exhausted && sessions.length > 0 ? (
          <ActivityIndicator style={styles.footer} color={color.muted} />
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  content: { paddingHorizontal: space.lg, paddingTop: space.sm },
  month: { marginTop: space.lg, marginBottom: space.sm },
  cardWrap: { marginBottom: space.md },
  empty: { textAlign: 'center', marginTop: space.xxl },
  footer: { marginVertical: space.lg },
});
