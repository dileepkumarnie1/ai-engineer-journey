import { beforeEach, describe, expect, it } from 'vitest';
import { addApplication, addLog, setModuleStatus, toggleCourseSelection, toggleLesson } from './actions';
import { exportBackup, parseBackup, resetAll, restoreBackup } from './backup';
import { db } from './db';

describe('backup', () => {
  beforeEach(async () => {
    await resetAll();
  });

  it('round-trips all data through export → parse → restore', async () => {
    await toggleCourseSelection('p0-role', 'baraa-roadmap');
    await toggleLesson('baraa-roadmap', 0);
    await setModuleStatus('p0-role', 'done');
    await addLog({ date: '2026-09-28', minutes: 90, moduleId: 'p0-role', mood: 5, note: 'Great start' });
    await addApplication({ company: 'Contoso', role: 'AI Engineer', url: 'https://example.com/job', status: 'applied', date: '2026-12-28' });

    const json = JSON.stringify(await exportBackup());
    await resetAll();
    expect(await db.logs.count()).toBe(0);

    const parsed = parseBackup(json);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    await restoreBackup(parsed.backup);

    expect((await db.moduleProgress.get('p0-role'))?.status).toBe('done');
    expect((await db.courseProgress.get('baraa-roadmap'))?.lessonsDone).toEqual([0]);
    expect(await db.logs.count()).toBe(1);
    expect(await db.applications.count()).toBe(1);
  });

  it('rejects malformed JSON and unsafe URLs', async () => {
    expect(parseBackup('{nope').ok).toBe(false);
    const backup = await exportBackup();
    backup.data.applications.push({ company: 'X', role: 'Y', url: 'javascript:alert(1)', status: 'applied', date: '2026-10-01' });
    const r = parseBackup(JSON.stringify(backup));
    expect(r.ok).toBe(false);
  });

  it('rejects backups from other apps', () => {
    const r = parseBackup(JSON.stringify({ app: 'other', version: 1, exportedAt: 'x', data: {} }));
    expect(r.ok).toBe(false);
  });

  it('auto-starts a module when a course is selected and toggles off cleanly', async () => {
    await toggleCourseSelection('p1-apis', 'httpx-docs');
    expect((await db.moduleProgress.get('p1-apis'))?.status).toBe('in-progress');
    await toggleCourseSelection('p1-apis', 'httpx-docs');
    expect((await db.moduleProgress.get('p1-apis'))?.selectedCourseIds).toEqual([]);
  });

  it('clamps log minutes', async () => {
    await addLog({ date: '2026-09-28', minutes: 5000 });
    expect((await db.logs.toArray())[0]?.minutes).toBe(600);
  });
});
