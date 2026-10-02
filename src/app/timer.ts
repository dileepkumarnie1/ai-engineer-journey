import { createContext, useContext } from 'react';

export type SessionPreset = 'micro' | 'standard' | 'deep';
export type SegmentKind = 'learn' | 'build' | 'break';

export interface Segment {
  kind: SegmentKind;
  sec: number;
}

export const PRESETS: { id: SessionPreset; emoji: string; label: string; hint: string }[] = [
  { id: 'micro', emoji: '⚡', label: 'Micro 15 min', hint: 'Low-energy day? 10 min learn + 5 min build still keeps your streak.' },
  { id: 'standard', emoji: '🎯', label: 'Standard', hint: 'Your daily plan: ⅔ learn, ⅓ build.' },
  { id: 'deep', emoji: '🔥', label: 'Deep 4×25', hint: 'Pomodoro: four 25-min focus blocks with 5-min breaks.' },
];

const MIN = 60;

export const buildSegments = (preset: SessionPreset, minutesPerDay: number): Segment[] => {
  if (preset === 'micro') return [{ kind: 'learn', sec: 10 * MIN }, { kind: 'build', sec: 5 * MIN }];
  if (preset === 'deep') {
    const pause: Segment = { kind: 'break', sec: 5 * MIN };
    return [
      { kind: 'learn', sec: 25 * MIN },
      pause,
      { kind: 'learn', sec: 25 * MIN },
      pause,
      { kind: 'build', sec: 25 * MIN },
      pause,
      { kind: 'build', sec: 25 * MIN },
    ];
  }
  const learn = Math.round(minutesPerDay * (2 / 3));
  return [{ kind: 'learn', sec: learn * MIN }, { kind: 'build', sec: (minutesPerDay - learn) * MIN }];
};

export const segmentAt = (segments: Segment[], elapsedSec: number) => {
  let t = 0;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    if (elapsedSec < t + seg.sec) return { index: i, kind: seg.kind as SegmentKind | 'done', leftSec: t + seg.sec - elapsedSec };
    t += seg.sec;
  }
  return { index: segments.length, kind: 'done' as const, leftSec: 0 };
};

/** Elapsed time excluding breaks: only focus time gets logged. */
export const focusSecAt = (segments: Segment[], elapsedSec: number) => {
  let t = 0;
  let focus = 0;
  for (const seg of segments) {
    if (seg.kind !== 'break') focus += Math.max(0, Math.min(seg.sec, elapsedSec - t));
    t += seg.sec;
  }
  return focus;
};

export const SEGMENT_LABEL: Record<SegmentKind | 'done', string> = {
  learn: '📚 Learn',
  build: '🛠 Build',
  break: '☕ Break',
  done: '✅ Done',
};

export interface TimerState {
  running: boolean;
  elapsedSec: number;
  totalSec: number;
  focusSec: number;
  preset: SessionPreset;
  segments: Segment[];
  segment: SegmentKind | 'done';
  segmentIndex: number;
  segmentLeftSec: number;
  moduleId?: string;
  start: (moduleId?: string) => void;
  pause: () => void;
  reset: () => void;
  setModule: (moduleId?: string) => void;
  setPreset: (preset: SessionPreset) => void;
  logAndReset: () => Promise<number>;
}

export const TimerContext = createContext<TimerState | null>(null);

export const useTimer = () => {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used inside <TimerProvider>');
  return ctx;
};

export const fmtClock = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
};
