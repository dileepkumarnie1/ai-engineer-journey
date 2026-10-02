import type { ReviewCard } from '@/db/db';
import { addDays, type ISODate } from './dates';

/** Days until the next review for Leitner boxes 1…5. */
export const BOX_DAYS = [1, 3, 7, 14, 30] as const;

export const gradeCard = (prev: ReviewCard | undefined, id: string, correct: boolean, today: ISODate): ReviewCard => {
  // Same-day repeats can't promote a card: spacing has to be earned.
  if (prev && correct && prev.lastReviewed === today) return prev;
  const box = correct ? Math.min(BOX_DAYS.length, (prev?.box ?? 0) + 1) : 1;
  return {
    id,
    box,
    due: addDays(today, BOX_DAYS[box - 1]!),
    reviews: (prev?.reviews ?? 0) + 1,
    lapses: (prev?.lapses ?? 0) + (correct ? 0 : 1),
    lastReviewed: today,
  };
};

/** Only authored questions, flow puzzles and flashcards are spaced; concept-match questions are random each time. */
export const isRecallKey = (key: string) => key.startsWith('q:') || key.startsWith('flow:') || key.startsWith('f:');
