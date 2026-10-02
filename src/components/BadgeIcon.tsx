import { Lock } from 'lucide-react';
import type { Badge } from '@/lib/gamification';
import { cn } from '@/lib/cn';

const TIER_STYLE = [
  'bg-slate-200 grayscale dark:bg-white/5',
  'bg-gradient-to-br from-amber-700 via-orange-600 to-amber-800 shadow-lg shadow-orange-900/30',
  'bg-gradient-to-br from-slate-100 via-slate-300 to-slate-400 shadow-lg shadow-slate-500/30',
  'bg-gradient-to-br from-amber-200 via-yellow-300 to-orange-400 shadow-lg shadow-amber-500/40',
];

/** Badge medallion; single-tier badges look gold once earned. */
export function BadgeIcon({ badge, tier, size = 'md' }: { badge: Badge; tier: number; size?: 'md' | 'lg' }) {
  const style = tier === 0 ? TIER_STYLE[0] : badge.tiers.length === 1 ? TIER_STYLE[3] : TIER_STYLE[tier];
  return (
    <div className={cn('relative grid shrink-0 place-items-center rounded-2xl', size === 'lg' ? 'size-20 text-4xl' : 'size-14 text-2xl', style)}>
      <span className={cn(tier === 0 && 'opacity-30')}>{badge.emoji}</span>
      {tier === 0 && <Lock className="absolute -bottom-1 -right-1 size-4 rounded-full bg-white p-0.5 text-slate-400 dark:bg-slate-800" aria-hidden />}
      {badge.tiers.length > 1 && (
        <span className="absolute -bottom-1.5 flex gap-0.5" aria-hidden>
          {badge.tiers.map((_, i) => (
            <span key={i} className={cn('size-1.5 rounded-full ring-1 ring-white/70', i < tier ? 'bg-slate-900 dark:bg-white' : 'bg-slate-300 dark:bg-white/20')} />
          ))}
        </span>
      )}
    </div>
  );
}
