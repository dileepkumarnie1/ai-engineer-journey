import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { addLog } from '@/db/actions';
import { useSettings } from '@/db/hooks';
import { todayISO } from '@/lib/dates';
import { TimerContext, type TimerState } from './timer';

/** App-wide focus timer: keeps running while you navigate between pages. */
export function TimerProvider({ children }: { children: ReactNode }) {
  const { minutesPerDay } = useSettings();
  const totalSec = minutesPerDay * 60;
  const learnSec = Math.round(totalSec * (2 / 3));

  const [moduleId, setModuleId] = useState<string>();
  const [elapsedBefore, setElapsedBefore] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (startedAt === null) return;
    const t = window.setInterval(() => {
      const n = Date.now();
      if (elapsedBefore + (n - startedAt) / 1000 >= totalSec) {
        setElapsedBefore(totalSec);
        setStartedAt(null);
      } else {
        setNow(n);
      }
    }, 1000);
    return () => window.clearInterval(t);
  }, [startedAt, elapsedBefore, totalSec]);

  const running = startedAt !== null;
  const elapsedSec = Math.min(
    totalSec,
    elapsedBefore + (startedAt !== null ? Math.max(0, now - startedAt) / 1000 : 0),
  );

  const start = useCallback((id?: string) => {
    if (id) setModuleId(id);
    const n = Date.now();
    setNow(n);
    setStartedAt(n);
  }, []);

  const pause = useCallback(() => {
    if (startedAt !== null) setElapsedBefore((e) => e + (Date.now() - startedAt) / 1000);
    setStartedAt(null);
  }, [startedAt]);

  const reset = useCallback(() => {
    setStartedAt(null);
    setElapsedBefore(0);
  }, []);

  const logAndReset = useCallback(async () => {
    const minutes = Math.round(elapsedSec / 60);
    if (minutes >= 1) await addLog({ date: todayISO(), minutes, moduleId });
    reset();
    return minutes;
  }, [elapsedSec, moduleId, reset]);

  const value = useMemo<TimerState>(
    () => ({
      running,
      elapsedSec,
      totalSec,
      learnSec,
      segment: elapsedSec >= totalSec ? 'done' : elapsedSec >= learnSec ? 'build' : 'learn',
      moduleId,
      start,
      pause,
      reset,
      setModule: setModuleId,
      logAndReset,
    }),
    [running, elapsedSec, totalSec, learnSec, moduleId, start, pause, reset, logAndReset],
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}
