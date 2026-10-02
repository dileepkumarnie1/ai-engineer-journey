import { Menu, Pause, Play, Settings as SettingsIcon, X } from 'lucide-react';
import { MotionConfig } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router';
import { Icon } from '@/components/ui';
import { useSettings } from '@/db/hooks';
import { cn } from '@/lib/cn';
import type { IconName } from '@/lib/icons';
import { ThemeCycleButton, ThemeToggle } from './ThemeToggle';
import { fmtClock, SEGMENT_LABEL, useTimer } from './timer';

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { to: '/recall', label: 'Daily Recall', icon: 'Brain' },
  { to: '/roadmap', label: 'Roadmap', icon: 'Map' },
  { to: '/courses', label: 'Courses', icon: 'GraduationCap' },
  { to: '/tracker', label: 'Tracker', icon: 'Clock' },
  { to: '/projects', label: 'Projects', icon: 'Hammer' },
  { to: '/videos', label: 'Videos', icon: 'Video' },
  { to: '/career', label: 'Career', icon: 'Briefcase' },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
      isActive
        ? 'bg-gradient-to-r from-violet-600/90 to-cyan-500/90 text-white shadow-md'
        : 'text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-white/10',
    );
  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {NAV.map((n) => (
        <NavLink key={n.to} to={n.to} end={n.to === '/'} className={linkClass} onClick={onNavigate}>
          <Icon name={n.icon} className="size-4" /> {n.label}
        </NavLink>
      ))}
      <NavLink to="/settings" className={linkClass} onClick={onNavigate}>
        <SettingsIcon aria-hidden className="size-4" /> Settings
      </NavLink>
    </nav>
  );
}

function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      to="/"
      onClick={onNavigate}
      aria-label="AI Engineer Journey — go to dashboard"
      className="flex items-center gap-3 rounded-xl px-2 py-1 transition hover:bg-slate-200/60 dark:hover:bg-white/5"
    >
      <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-9 transition hover:rotate-6" />
      <div className="leading-tight">
        <p className="font-bold">AI Engineer</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Journey · 90 days</p>
      </div>
    </Link>
  );
}

function TimerChip() {
  const t = useTimer();
  if (!t.running && t.elapsedSec === 0) return null;
  return (
    <NavLink
      to="/tracker"
      className="fixed bottom-4 right-4 z-40 flex items-center gap-3 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-2xl ring-1 ring-white/20 dark:bg-white dark:text-slate-900"
      aria-label="Focus timer"
    >
      <span className={cn('size-2 rounded-full', t.running ? 'animate-pulse bg-emerald-400' : 'bg-amber-400')} />
      {SEGMENT_LABEL[t.segment]}
      <span className="tabular-nums">{fmtClock(t.elapsedSec)}</span>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          if (t.running) t.pause();
          else t.start();
        }}
        className="rounded-full p-1 hover:bg-white/20 dark:hover:bg-black/10"
        aria-label={t.running ? 'Pause timer' : 'Resume timer'}
      >
        {t.running ? <Pause className="size-4" /> : <Play className="size-4" />}
      </button>
    </NavLink>
  );
}

export function Layout() {
  const { theme } = useSettings();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () =>
      document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && mq.matches));
    apply();
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // storage unavailable; theme still applies for this session
    }
    if (theme !== 'system') return;
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="aurora" />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-slate-900">
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-6 border-r border-slate-200/70 bg-white/60 p-4 backdrop-blur lg:flex dark:border-white/10 dark:bg-black/20">
        <Brand />
        <NavItems />
        <div className="mt-auto">
          <ThemeToggle theme={theme} />
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/70 bg-white/70 px-4 py-3 backdrop-blur lg:hidden dark:border-white/10 dark:bg-black/40">
        <Brand />
        <div className="flex gap-1">
          <ThemeCycleButton theme={theme} />
          <button type="button" onClick={() => setOpen(true)} className="rounded-lg p-2" aria-label="Open menu">
            <Menu className="size-5" />
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-72 flex-col gap-6 bg-white p-4 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <Brand onNavigate={() => setOpen(false)} />
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2" aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            <NavItems onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <main id="main" className="px-4 py-6 sm:px-6 lg:ml-60 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
      <TimerChip />
      <ScrollRestoration />
    </MotionConfig>
  );
}
