import { motion } from 'motion/react';
import type { Journey } from '@/hooks/useJourney';
import { cn } from '@/lib/cn';
import { XP_RULES } from '@/lib/gamification';

export function DailyQuestsCard({ j }: { j: Journey }) {
  const done = j.quests.filter((q) => q.done).length;
  return (
    <section className="glass flex h-full flex-col p-6">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">🗺️ Daily quests</h2>
        <span className="text-sm text-slate-500">
          <span className="font-bold text-slate-900 dark:text-white">{done}</span> / {j.quests.length}
        </span>
      </div>
      <p className="mb-4 text-sm text-slate-500">Three small wins, fresh every day. +{XP_RULES.quest} XP each.</p>
      <ul className="space-y-2">
        {j.quests.map(({ quest, progress, done: complete }, i) => (
          <motion.li
            key={quest.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            className={cn('rounded-2xl border p-3', complete ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-slate-200 dark:border-white/10')}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl" aria-hidden>{complete ? '✅' : quest.emoji}</span>
              <p className={cn('flex-1 text-sm font-medium', complete && 'text-slate-500 line-through')}>{quest.title}</p>
              <span className="text-xs font-semibold text-slate-500">{Math.round(progress * 100)}%</span>
            </div>
            {!complete && progress > 0 && (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${progress * 100}%` }} />
              </div>
            )}
          </motion.li>
        ))}
      </ul>
      {done === j.quests.length && <p className="mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">🏆 All quests done. See you tomorrow!</p>}
    </section>
  );
}
