import type { Course } from '@/content/schema';

const WEIGHTS = { interactivity: 0.35, visual: 0.25, handsOn: 0.2, popularity: 0.2 } as const;

/** Engagement score 0–100; favours interactive, visual, hands-on and popular courses. */
export const engagementScore = (c: Pick<Course, keyof typeof WEIGHTS>): number => {
  const raw =
    WEIGHTS.interactivity * c.interactivity +
    WEIGHTS.visual * c.visual +
    WEIGHTS.handsOn * c.handsOn +
    WEIGHTS.popularity * c.popularity;
  return Math.round((raw / 5) * 100);
};

export type CourseSort = 'engagement' | 'popularity' | 'shortest';

export const sortCourses = <T extends Course>(list: T[], sort: CourseSort = 'engagement'): T[] => {
  const copy = [...list];
  switch (sort) {
    case 'popularity':
      return copy.sort((a, b) => b.popularity - a.popularity || engagementScore(b) - engagementScore(a));
    case 'shortest':
      return copy.sort((a, b) => a.hours - b.hours);
    default:
      return copy.sort((a, b) => engagementScore(b) - engagementScore(a) || b.popularity - a.popularity);
  }
};

export const engagementLabel = (score: number): string =>
  score >= 80 ? 'Highly engaging' : score >= 65 ? 'Engaging' : score >= 50 ? 'Solid' : 'Reference';
