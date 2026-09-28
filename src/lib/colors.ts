export type Hue =
  | 'sky'
  | 'emerald'
  | 'violet'
  | 'fuchsia'
  | 'cyan'
  | 'amber'
  | 'rose'
  | 'orange'
  | 'indigo';

interface HueClasses {
  gradient: string;
  text: string;
  soft: string;
  border: string;
  dot: string;
  hex: string;
}

// Full class strings so Tailwind can detect them statically.
export const hues: Record<Hue, HueClasses> = {
  sky: {
    gradient: 'from-sky-500 to-blue-600',
    text: 'text-sky-500 dark:text-sky-300',
    soft: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    dot: 'bg-sky-500',
    hex: '#0ea5e9',
  },
  emerald: {
    gradient: 'from-emerald-500 to-teal-600',
    text: 'text-emerald-600 dark:text-emerald-300',
    soft: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-500',
    hex: '#10b981',
  },
  violet: {
    gradient: 'from-violet-500 to-purple-600',
    text: 'text-violet-600 dark:text-violet-300',
    soft: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    dot: 'bg-violet-500',
    hex: '#8b5cf6',
  },
  fuchsia: {
    gradient: 'from-fuchsia-500 to-pink-600',
    text: 'text-fuchsia-600 dark:text-fuchsia-300',
    soft: 'bg-fuchsia-500/10',
    border: 'border-fuchsia-500/30',
    dot: 'bg-fuchsia-500',
    hex: '#d946ef',
  },
  cyan: {
    gradient: 'from-cyan-500 to-sky-600',
    text: 'text-cyan-600 dark:text-cyan-300',
    soft: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    dot: 'bg-cyan-500',
    hex: '#06b6d4',
  },
  amber: {
    gradient: 'from-amber-500 to-orange-600',
    text: 'text-amber-600 dark:text-amber-300',
    soft: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    dot: 'bg-amber-500',
    hex: '#f59e0b',
  },
  rose: {
    gradient: 'from-rose-500 to-red-600',
    text: 'text-rose-600 dark:text-rose-300',
    soft: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    dot: 'bg-rose-500',
    hex: '#f43f5e',
  },
  orange: {
    gradient: 'from-orange-500 to-amber-500',
    text: 'text-orange-600 dark:text-orange-300',
    soft: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    dot: 'bg-orange-500',
    hex: '#f97316',
  },
  indigo: {
    gradient: 'from-indigo-500 to-blue-700',
    text: 'text-indigo-600 dark:text-indigo-300',
    soft: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    dot: 'bg-indigo-500',
    hex: '#6366f1',
  },
};
