import { describe, expect, it } from 'vitest';
import { buildSegments, focusSecAt, segmentAt } from '@/app/timer';
import { allModules, getModule } from '@/content';
import type { ModuleProgress, ReviewCard } from '@/db/db';
import { buildQuiz, isCorrect, masteryCheck, scoreQuiz, shuffle } from './quiz';
import { gradeCard, recallQueue, resolveCard, weakSpots } from './srs';

const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

describe('quiz builder', () => {
  const m = getModule('p4-rag')!;

  it('adds a concept-match and a flow-ordering question to the authored ones', () => {
    const qs = buildQuiz(m, seeded(1));
    expect(qs).toHaveLength(m.quiz.length + 2);
    expect(qs.map((q) => q.key)).toEqual([...m.quiz.map((_, i) => `q:p4-rag:${i}`), 'card:p4-rag', 'flow:p4-rag']);
  });

  it('keeps the correct answer when shuffling options', () => {
    for (let seed = 1; seed < 20; seed++) {
      const q = buildQuiz(m, seeded(seed))[0]!;
      if (q.kind !== 'mcq') throw new Error('expected mcq');
      expect(q.options[q.answer]).toBe(m.quiz[0]!.options[m.quiz[0]!.answer]);
    }
  });

  it('never presents a flow puzzle already solved', () => {
    for (const mod of allModules) {
      const flow = buildQuiz(mod, seeded(7)).at(-1)!;
      if (flow.kind !== 'order') throw new Error('expected order');
      expect(flow.shuffled).not.toEqual(flow.steps);
      expect(isCorrect(flow, flow.steps)).toBe(true);
    }
  });

  it('scores answers and applies the 70% / confidence mastery gate', () => {
    const qs = buildQuiz(m, seeded(3));
    const answers = Object.fromEntries(qs.map((q) => [q.key, q.kind === 'mcq' ? q.answer : q.steps]));
    expect(scoreQuiz(qs, answers).score).toBe(100);
    const base: ModuleProgress = { moduleId: 'x', status: 'in-progress', selectedCourseIds: [], notes: '' };
    expect(masteryCheck({ ...base, quizScore: 70, confidence: 3 }).ready).toBe(true);
    expect(masteryCheck({ ...base, quizScore: 69, confidence: 5 }).ready).toBe(false);
    expect(masteryCheck({ ...base, quizScore: 100, confidence: 2 }).ready).toBe(false);
  });

  it('shuffle keeps every item', () => {
    expect(shuffle([1, 2, 3, 4, 5], seeded(9)).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('spaced repetition', () => {
  it('climbs Leitner boxes on success and drops to box 1 on a miss', () => {
    let c = gradeCard(undefined, 'q:p4-rag:0', true, '2026-10-01');
    expect(c).toMatchObject({ box: 1, due: '2026-10-02', reviews: 1, lapses: 0 });
    c = gradeCard(c, c.id, true, '2026-10-02');
    expect(c).toMatchObject({ box: 2, due: '2026-10-05' });
    c = gradeCard(c, c.id, false, '2026-10-05');
    expect(c).toMatchObject({ box: 1, due: '2026-10-06', lapses: 1 });
  });

  it('does not promote a card twice on the same day', () => {
    const c = gradeCard(undefined, 'q:p4-rag:0', true, '2026-10-01');
    expect(gradeCard(c, c.id, true, '2026-10-01')).toBe(c);
  });

  it('queues due cards, then a few new flashcards once unlocked', () => {
    const cards: ReviewCard[] = [
      { id: 'q:p4-rag:0', box: 1, due: '2026-10-01', reviews: 1, lapses: 0 },
      { id: 'flow:p4-rag', box: 2, due: '2026-10-09', reviews: 2, lapses: 0 },
      { id: 'q:gone-module:0', box: 1, due: '2026-10-01', reviews: 1, lapses: 0 },
    ];
    expect(recallQueue(cards, '2026-10-02', false)).toEqual(['q:p4-rag:0']);
    expect(recallQueue(cards, '2026-10-02', true)).toEqual(['q:p4-rag:0', 'f:0', 'f:1', 'f:2']);
  });

  it('resolves card ids to renderable items', () => {
    expect(resolveCard('f:0')?.kind).toBe('flash');
    expect(resolveCard('flow:p4-rag')).toMatchObject({ kind: 'question', source: getModule('p4-rag')!.title });
    expect(resolveCard('q:p4-rag:99')).toBeNull();
  });

  it('ranks weak spots by quiz gap, confidence and recall misses', () => {
    const mp = new Map<string, ModuleProgress>([
      ['p4-rag', { moduleId: 'p4-rag', status: 'in-progress', selectedCourseIds: [], notes: '', quizScore: 40, confidence: 2 }],
      ['p2-ml', { moduleId: 'p2-ml', status: 'done', selectedCourseIds: [], notes: '', quizScore: 100, confidence: 5 }],
    ]);
    const cards: ReviewCard[] = [{ id: 'q:p2-ml:0', box: 1, due: '2026-10-01', reviews: 3, lapses: 2 }];
    const spots = weakSpots(allModules, mp, cards);
    expect(spots.map((s) => s.module.id)).toEqual(['p4-rag', 'p2-ml']);
    expect(spots[0]!.reasons).toEqual(['Quiz best 40%', 'Low confidence']);
  });
});

describe('session presets', () => {
  it('splits standard sessions 2/3 learn and 1/3 build', () => {
    expect(buildSegments('standard', 90).map((s) => [s.kind, s.sec / 60])).toEqual([['learn', 60], ['build', 30]]);
  });

  it('logs only focus time in deep sessions, not breaks', () => {
    const deep = buildSegments('deep', 90);
    expect(deep.reduce((sum, s) => sum + s.sec, 0) / 60).toBe(115);
    expect(segmentAt(deep, 26 * 60)).toMatchObject({ index: 1, kind: 'break' });
    expect(focusSecAt(deep, 30 * 60) / 60).toBe(25);
    expect(segmentAt(deep, 115 * 60).kind).toBe('done');
  });
});
