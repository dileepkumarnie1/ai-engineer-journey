import { useLiveQuery } from 'dexie-react-hooks';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { BadgeIcon } from '@/components/BadgeIcon';
import { Button } from '@/components/ui';
import { recordQuests, saveSettings } from '@/db/actions';
import { db } from '@/db/db';
import { questContext, summarize } from '@/lib/achievements';
import { todayISO } from '@/lib/dates';
import { BADGES, earnedBadgeKeys, levelFor, LEVELS, tierName, XP_RULES } from '@/lib/gamification';
import { questStatus } from '@/lib/quests';
import { stretchFor } from '@/lib/schedule';

type Toast = { key: string } & ({ kind: 'badge'; badgeId: string; tier: number } | { kind: 'quest'; emoji: string; title: string });

const BURST = Array.from({ length: 14 }, (_, i) => ({
  emoji: ['✨', '🎉', '⭐', '💜'][i % 4],
  x: Math.cos((i / 14) * Math.PI * 2) * 140,
  y: Math.sin((i / 14) * Math.PI * 2) * 110,
}));

/** Reads everything in one live query so we only compare once all data is loaded. */
const useAchievementSnapshot = () =>
  useLiveQuery(async () => {
    const [settings, logs, mpRows, cpRows, ms, career, cards, checkins, attempts, questLog, bosses] = await Promise.all([
      db.settings.get('app'),
      db.logs.toArray(),
      db.moduleProgress.toArray(),
      db.courseProgress.toArray(),
      db.milestones.toArray(),
      db.career.toArray(),
      db.reviewCards.toArray(),
      db.checkins.toArray(),
      db.quizAttempts.toArray(),
      db.questLog.toArray(),
      db.bosses.toArray(),
    ]);
    if (!settings?.onboarded) return null;
    const today = todayISO();
    const mp = new Map(mpRows.map((r) => [r.moduleId, r]));
    const { xp, badgeInput } = summarize({
      schedule: { startDate: settings.startDate, restDay: settings.restDay, stretch: stretchFor(settings.targetDays) },
      today,
      logs,
      mp,
      cp: new Map(cpRows.map((r) => [r.courseId, r])),
      milestones: new Map(ms.map((r) => [r.id, r.status])),
      careerDone: career.filter((c) => c.done).length,
      cards,
      questsDone: questLog.length,
      bossesPassed: bosses.filter((b) => b.passedAt).length,
    });
    const logged = new Set(questLog.map((q) => q.key));
    const newQuests = questStatus(today, questContext({ today, logs, cards, attempts, checkins, mp }))
      .filter((q) => q.done && !logged.has(`${today}:${q.quest.id}`))
      .map((q) => q.quest);
    return { settings, today, newQuests, earned: earnedBadgeKeys(badgeInput), level: levelFor(xp).level };
  }, []);

export function Celebrations() {
  const snap = useAchievementSnapshot();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [levelUp, setLevelUp] = useState<number | null>(null);

  const queued = useRef(new Set<string>());

  useEffect(() => {
    if (!snap) return;
    const { settings, earned, level, today } = snap;
    const quests = snap.newQuests.filter((q) => !queued.current.has(`quest:${today}:${q.id}`));
    if (quests.length) {
      for (const q of quests) queued.current.add(`quest:${today}:${q.id}`);
      void recordQuests(today, quests.map((q) => q.id)).then(() =>
        setToasts((t) => [...t, ...quests.map((q) => ({ key: `quest:${today}:${q.id}`, kind: 'quest' as const, emoji: q.emoji, title: q.title }))]),
      );
    }
    // First run (or a restored older backup): remember the current state silently.
    if (!settings.seenBadges || settings.seenLevel === undefined) {
      void saveSettings({ seenBadges: earned, seenLevel: level });
      return;
    }
    const seen = new Set(settings.seenBadges);
    const fresh = earned.filter((k) => !seen.has(k) && !queued.current.has(k));
    const levelKey = `level:${level}`;
    const up = level > settings.seenLevel && !queued.current.has(levelKey);
    if (!fresh.length && !up) return;
    for (const k of fresh) queued.current.add(k);
    if (up) queued.current.add(levelKey);
    void saveSettings({ seenBadges: [...new Set([...settings.seenBadges, ...earned])], seenLevel: Math.max(level, settings.seenLevel) }).then(() => {
      setToasts((t) => [
        ...t,
        ...fresh.map((key) => {
          const [badgeId = '', tier = '1'] = key.split(':');
          return { key, kind: 'badge' as const, badgeId, tier: Number(tier) };
        }),
      ]);
      if (up) setLevelUp(level);
    });
  }, [snap]);

  useEffect(() => {
    if (!toasts.length) return;
    const t = window.setTimeout(() => setToasts((all) => all.slice(1)), 5000);
    return () => window.clearTimeout(t);
  }, [toasts]);

  useEffect(() => {
    if (levelUp === null) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setLevelUp(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [levelUp]);

  const lvl = levelUp !== null ? LEVELS[levelUp - 1] : undefined;

  return (
    <>
      <div className="pointer-events-none fixed bottom-4 left-4 z-50 flex flex-col gap-2 lg:left-64" aria-live="polite">
        <AnimatePresence>
          {toasts.slice(0, 3).map((t) => {
            if (t.kind === 'quest') {
              return (
                <motion.div
                  key={t.key}
                  initial={{ opacity: 0, x: -40, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -40 }}
                  className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-white p-3 pr-5 shadow-2xl ring-1 ring-emerald-300 dark:bg-slate-900 dark:ring-emerald-500/40"
                >
                  <span className="grid size-14 place-items-center rounded-2xl bg-emerald-500/15 text-2xl">{t.emoji}</span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-500">Quest complete · +{XP_RULES.quest} XP</p>
                    <p className="font-bold">{t.title}</p>
                  </div>
                </motion.div>
              );
            }
            const badge = BADGES.find((b) => b.id === t.badgeId);
            if (!badge) return null;
            const name = tierName(badge, t.tier);
            return (
              <motion.div
                key={t.key}
                initial={{ opacity: 0, x: -40, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -40 }}
                className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-white p-3 pr-5 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-white/10"
              >
                <BadgeIcon badge={badge} tier={t.tier} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-500">Badge unlocked{name ? ` · ${name}` : ''}</p>
                  <p className="font-bold">{badge.title}</p>
                  <p className="text-xs text-slate-500">{badge.goal(badge.tiers[t.tier - 1]!)}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {lvl && (
          <motion.div
            className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLevelUp(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="levelup-title"
              initial={{ scale: 0.6, rotate: -6 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 14 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm rounded-[2rem] bg-gradient-to-br from-violet-700 via-indigo-600 to-cyan-500 p-8 text-center text-white shadow-2xl"
            >
              {BURST.map((b, i) => (
                <motion.span
                  key={i}
                  className="pointer-events-none absolute left-1/2 top-1/3 text-xl"
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
                  animate={{ x: b.x, y: b.y, opacity: 0, scale: 1.2 }}
                  transition={{ duration: 1.4, ease: 'easeOut', delay: 0.15 }}
                  aria-hidden
                >
                  {b.emoji}
                </motion.span>
              ))}
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/80">Level up!</p>
              <p className="my-4 text-7xl" aria-hidden>{lvl.emoji}</p>
              <h2 id="levelup-title" className="text-3xl font-extrabold">Level {levelUp} · {lvl.title}</h2>
              <p className="mt-2 text-sm text-white/85">One step closer to AI Engineer. Keep the momentum.</p>
              <Button variant="outline" className="mt-6 border-white/60 bg-white/15 text-white hover:bg-white/25" onClick={() => setLevelUp(null)} autoFocus>
                Keep going 🚀
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
