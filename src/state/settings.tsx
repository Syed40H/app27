import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getSetting, setSetting } from '@/db/queries';
import type { Unit } from '@/domain/types';

/**
 * App-wide preferences.
 *
 * Only the unit lives here. It is read once at launch and written straight
 * through to SQLite on change, so there is nothing to sync and nothing to lose.
 */

const UNIT_KEY = 'unit';

interface SettingsValue {
  unit: Unit;
  setUnit: (unit: Unit) => void;
  /** False until the stored preference has been read. */
  ready: boolean;
}

const SettingsContext = createContext<SettingsValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [unit, setUnitState] = useState<Unit>('lb');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await getSetting(UNIT_KEY);
        if (!cancelled && (stored === 'lb' || stored === 'kg')) setUnitState(stored);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setUnit = useCallback((next: Unit) => {
    // Optimistic: the toggle should not wait on a disk write to move.
    setUnitState(next);
    void setSetting(UNIT_KEY, next);
  }, []);

  const value = useMemo<SettingsValue>(() => ({ unit, setUnit, ready }), [unit, setUnit, ready]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useSettings must be used inside a SettingsProvider');
  return value;
}

/** Convenience for the many places that only need the unit. */
export function useUnit(): Unit {
  return useSettings().unit;
}
