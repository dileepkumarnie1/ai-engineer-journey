import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { addLog } from '@/db/actions';
import { useSettings } from '@/db/hooks';
import { todayISO } from '@/lib/dates';
import { buildSegments, focusSecAt, segmentAt, TimerContext, type SessionPreset, type TimerState } from './timer';

const chime = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain).connect(ctx.destination);
    osc.onended = () => void ctx.close();
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // audio unavailable; the on-screen segment label still changes
  }
};

/** App-wide focus timer: keeps running while you navigate between pages. */
export function TimerProvider({ children }: { children: ReactNode }) {
  const { minutesPerDay } = useSettings();
  const [preset, setPresetState] = useState<SessionPreset>('standard');
  const segments = useMemo(() => buildSegments(preset, minutesPerDay), [preset, minutesPerDay]);
  const totalSec = segments.reduce((sum, s) => sum + s.sec, 0);

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
  const seg = segmentAt(segments, elapsedSec);
  const focusSec = focusSecAt(segments, elapsedSec);

  const lastIndex = useRef(seg.index);
  useEffect(() => {
    if (seg.index > lastIndex.current && elapsedSec > 0) chime();
    lastIndex.current = seg.index;
  }, [seg.index, elapsedSec]);

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

  const setPreset = useCallback(
    (p: SessionPreset) => {
      if (startedAt === null && elapsedBefore === 0) setPresetState(p);
    },
    [startedAt, elapsedBefore],
  );

  const logAndReset = useCallback(async () => {
    const minutes = Math.round(focusSec / 60);
    if (minutes >= 1) await addLog({ date: todayISO(), minutes, moduleId });
    reset();
    return minutes;
  }, [focusSec, moduleId, reset]);

  const value = useMemo<TimerState>(
    () => ({
      running,
      elapsedSec,
      totalSec,
      focusSec,
      preset,
      segments,
      segment: seg.kind,
      segmentIndex: seg.index,
      segmentLeftSec: seg.leftSec,
      moduleId,
      start,
      pause,
      reset,
      setModule: setModuleId,
      setPreset,
      logAndReset,
    }),
    [running, elapsedSec, totalSec, focusSec, preset, segments, seg.kind, seg.index, seg.leftSec, moduleId, start, pause, reset, setPreset, logAndReset],
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}
