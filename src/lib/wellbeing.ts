import type { SessionPreset } from '@/app/timer';
import type { Checkin, DailyLog, Energy } from '@/db/db';
import { addDays, type ISODate } from './dates';

export const ENERGY: Record<Energy, { emoji: string; label: string; preset: SessionPreset }> = {
  1: { emoji: '🪫', label: 'Low', preset: 'micro' },
  2: { emoji: '🙂', label: 'Okay', preset: 'standard' },
  3: { emoji: '⚡', label: 'High', preset: 'deep' },
};

/** Low-energy check-ins plus low-mood logs (≤ 2 of 5) in the last `days` days. */
export const lowSignals = (checkins: Checkin[], logs: DailyLog[], today: ISODate, days = 7) => {
  const from = addDays(today, -days);
  return (
    checkins.filter((c) => c.date > from && c.date <= today && c.energy === 1).length +
    logs.filter((l) => l.date > from && l.date <= today && l.mood !== undefined && l.mood <= 2).length
  );
};

export const REPLAN = { behindDays: 3, lowSignals: 2 } as const;

/** Offer the 120-day plan when the learner is clearly behind AND running low, unless dismissed recently. */
export const shouldOfferReplan = (o: {
  pace: number;
  targetDays: number;
  lowSignals: number;
  today: ISODate;
  dismissedUntil?: ISODate;
}) =>
  o.targetDays === 90 &&
  o.pace <= -REPLAN.behindDays &&
  o.lowSignals >= REPLAN.lowSignals &&
  !(o.dismissedUntil && o.dismissedUntil >= o.today);
