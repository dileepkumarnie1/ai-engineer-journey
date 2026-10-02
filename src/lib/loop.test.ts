import { beforeEach, describe, expect, it } from 'vitest';
import { getModule, getPhase } from '@/content';
import { isSafeUrl, recordBoss, recordQuests, setExplanation, setProofUrl, toggleBuildCheck } from '@/db/actions';
import { exportBackup, parseBackup, resetAll } from '@/db/backup';
import { db } from '@/db/db';
import { isBuildVerified, isExplained, questContext, summarize } from './achievements';
import { dailyQuests, QUEST_GROUPS, questStatus, type QuestContext } from './quests';
import { BOSS_QUESTIONS, buildBossQuiz, seededRng } from './quiz';

const ctx: QuestContext = {
  todayMinutes: 0,
  reviewsToday: 0,
  quizScoresToday: [],
  reflected: false,
  explainedToday: false,
  buildTickedToday: false,
  hasCards: false,
};

describe('daily quests', () => {
  it('picks one warm-up, one core and one stretch quest, stable for the day', () => {
    const a = dailyQuests('2026-10-02', ctx).map((q) => q.id);
    expect(a).toEqual(dailyQuests('2026-10-02', ctx).map((q) => q.id));
    a.forEach((id, g) => expect(QUEST_GROUPS[g]!.some((q) => q.id === id)).toBe(true));
  });

  it('never offers the recall quest without a deck', () => {
    for (let d = 1; d <= 28; d++) {
      const date = `2026-11-${String(d).padStart(2, '0')}`;
      expect(dailyQuests(date, ctx).some((q) => q.id === 'recall-5')).toBe(false);
    }
  });

  it('reports partial progress and completion', () => {
    const status = questStatus('2026-10-02', { ...ctx, todayMinutes: 90, energy: 2, reflected: true, quizScoresToday: [100], explainedToday: true, buildTickedToday: true });
    expect(status.every((s) => s.done)).toBe(true);
    const focus = QUEST_GROUPS[1]!.find((q) => q.id === 'focus-25')!;
    expect(focus.progress({ ...ctx, todayMinutes: 10 })).toBeCloseTo(0.4);
  });
});

describe('phase boss', () => {
  it('mixes questions from across the phase plus a flow puzzle', () => {
    const phase = getPhase('p4')!;
    const qs = buildBossQuiz(phase, seededRng('boss'));
    expect(qs).toHaveLength(BOSS_QUESTIONS + 1);
    expect(qs.at(-1)!.kind).toBe('order');
    const modules = new Set(qs.slice(0, -1).map((q) => q.key.split(':')[1]));
    expect(modules.size).toBeGreaterThan(1);
  });

  it('uses every question when a phase has fewer than the cap', () => {
    const phase = getPhase('p0')!;
    expect(buildBossQuiz(phase, seededRng('x'))).toHaveLength(phase.modules.reduce((n, m) => n + m.quiz.length, 0) + 1);
  });

  it('seeded RNG is deterministic', () => {
    const a = seededRng('p1-core');
    const b = seededRng('p1-core');
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe('learning loop data', () => {
  beforeEach(async () => {
    await resetAll();
  });

  it('only stores http(s) proof links', async () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('https://github.com/me/repo')).toBe(true);
    expect(await setProofUrl('p1-core', 'javascript:alert(1)')).toBe(false);
    expect(await setProofUrl('p1-core', 'https://github.com/me/repo')).toBe(true);
    expect((await db.moduleProgress.get('p1-core'))?.proofUrl).toBe('https://github.com/me/repo');
  });

  it('counts explanations and verified builds toward XP and quests', async () => {
    const m = getModule('p1-core')!;
    await setExplanation(m.id, 'Generators yield rows lazily; decorators wrap calls with retry logic.');
    for (let i = 0; i < m.checks.length; i++) await toggleBuildCheck(m.id, i);
    const row = (await db.moduleProgress.get(m.id))!;
    expect(isExplained(row)).toBe(true);
    expect(isBuildVerified(row)).toBe(true);
    const mp = new Map([[m.id, row]]);
    const base = { schedule: { startDate: '2026-09-28', restDay: 0 }, today: row.explainedAt!, logs: [], mp, cp: new Map(), milestones: new Map(), careerDone: 0, cards: [] };
    expect(summarize({ ...base, questsDone: 0, bossesPassed: 0 }).xp).toBe(25 + 50);
    expect(summarize({ ...base, questsDone: 2, bossesPassed: 1 }).xp).toBe(25 + 50 + 40 + 200);
    const q = questContext({ today: row.explainedAt!, logs: [], cards: [], attempts: [], checkins: [], mp });
    expect(q).toMatchObject({ explainedToday: true, buildTickedToday: true });
  });

  it('keeps a boss pass once earned and round-trips quests and bosses through backup', async () => {
    await recordBoss('p1', 90, true, '2026-10-02');
    await recordBoss('p1', 60, false, '2026-10-03');
    expect(await db.bosses.get('p1')).toEqual({ phaseId: 'p1', best: 90, passedAt: '2026-10-02' });
    await recordQuests('2026-10-02', ['checkin', 'quiz']);
    const parsed = parseBackup(JSON.stringify(await exportBackup()));
    expect(parsed.ok && parsed.backup.data.questLog.length).toBe(2);
    expect(parsed.ok && parsed.backup.data.bosses[0]?.passedAt).toBe('2026-10-02');
  });

  it('rejects unsafe proof links inside an imported backup', async () => {
    const backup = await exportBackup();
    backup.data.moduleProgress.push({ moduleId: 'p1-core', status: 'in-progress', selectedCourseIds: [], notes: '', proofUrl: 'javascript:alert(1)' });
    expect(parseBackup(JSON.stringify(backup)).ok).toBe(false);
  });
});
