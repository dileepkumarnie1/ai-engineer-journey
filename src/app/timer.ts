import { createContext, useContext } from 'react';

export interface TimerState {
  running: boolean;
  elapsedSec: number;
  totalSec: number;
  learnSec: number;
  segment: 'learn' | 'build' | 'done';
  moduleId?: string;
  start: (moduleId?: string) => void;
  pause: () => void;
  reset: () => void;
  setModule: (moduleId?: string) => void;
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
