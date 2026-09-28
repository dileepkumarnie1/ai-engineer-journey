import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger' | 'success';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/20 hover:brightness-110',
  outline:
    'border border-slate-300 bg-white/60 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10',
  ghost: 'hover:bg-slate-200/60 dark:hover:bg-white/10',
  danger: 'bg-rose-600 text-white hover:bg-rose-500',
  success: 'bg-emerald-600 text-white hover:bg-emerald-500',
};

/** Shared by <Button> and button-styled links. */
export const buttonStyles = (variant: ButtonVariant = 'primary', size: 'sm' | 'md' = 'md', extra?: string) =>
  cn(
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
    size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2.5 text-sm',
    variants[variant],
    extra,
  );
