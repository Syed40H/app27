import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

/**
 * Load data from SQLite and keep it fresh.
 *
 * Reads run again every time the screen regains focus, which is what makes
 * returning from a session show the numbers just logged without any store,
 * cache or invalidation layer. Reads are local and take microseconds, so
 * re-running one is cheaper than keeping it in sync.
 */
export function useQuery<T>(loader: () => Promise<T>): {
  data: T | null;
  loading: boolean;
  reload: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  // Keeps the newest loader without making it a dependency of the effect, so
  // an inline arrow function in a screen body cannot cause a reload loop.
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  /** Guards against a slow earlier read overwriting a newer one. */
  const generation = useRef(0);

  const run = useCallback(() => {
    const current = ++generation.current;
    setLoading(true);
    loaderRef
      .current()
      .then((result) => {
        if (current === generation.current) setData(result);
      })
      .catch((error: unknown) => {
        console.error('[repa] query failed', error);
      })
      .finally(() => {
        if (current === generation.current) setLoading(false);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      run();
    }, [run]),
  );

  return { data, loading, reload: run };
}
