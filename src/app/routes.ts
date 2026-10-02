import type { ComponentType } from 'react';
import { createBrowserRouter } from 'react-router';
import { ErrorPage } from './ErrorPage';
import { Layout } from './Layout';
import { PageLoader } from './PageLoader';

type PageModule = Promise<{ default: ComponentType }>;
const page = (load: () => PageModule) => async () => ({ Component: (await load()).default });

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    ErrorBoundary: ErrorPage,
    HydrateFallback: PageLoader,
    children: [
      { index: true, lazy: page(() => import('@/features/dashboard/DashboardPage')) },
      { path: 'welcome', lazy: page(() => import('@/features/onboarding/WelcomePage')) },
      { path: 'recall', lazy: page(() => import('@/features/recall/RecallPage')) },
      { path: 'roadmap', lazy: page(() => import('@/features/roadmap/RoadmapPage')) },
      { path: 'module/:moduleId', lazy: page(() => import('@/features/modules/ModulePage')) },
      { path: 'boss/:phaseId', lazy: page(() => import('@/features/boss/BossPage')) },
      { path: 'courses', lazy: page(() => import('@/features/courses/CoursesPage')) },
      { path: 'tracker', lazy: page(() => import('@/features/tracker/TrackerPage')) },
      { path: 'projects', lazy: page(() => import('@/features/projects/ProjectsPage')) },
      { path: 'videos', lazy: page(() => import('@/features/videos/VideosPage')) },
      { path: 'career', lazy: page(() => import('@/features/career/CareerPage')) },
      { path: 'settings', lazy: page(() => import('@/features/settings/SettingsPage')) },
      { path: '*', Component: ErrorPage },
    ],
  },
], { basename: import.meta.env.BASE_URL });
