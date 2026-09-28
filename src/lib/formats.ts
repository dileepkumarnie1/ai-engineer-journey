import type { CourseFormat } from '@/content/formats';
import type { IconName } from './icons';

export const formatMeta: Record<CourseFormat, { label: string; icon: IconName; gradient: string }> = {
  video: { label: 'Video', icon: 'Video', gradient: 'from-rose-500 to-orange-400' },
  interactive: { label: 'Interactive', icon: 'Zap', gradient: 'from-violet-500 to-fuchsia-500' },
  course: { label: 'Course', icon: 'GraduationCap', gradient: 'from-sky-500 to-indigo-500' },
  notebook: { label: 'Notebook', icon: 'Code2', gradient: 'from-emerald-500 to-teal-500' },
  article: { label: 'Article', icon: 'FileText', gradient: 'from-amber-500 to-orange-500' },
  docs: { label: 'Docs', icon: 'Layers', gradient: 'from-slate-500 to-slate-700' },
};

export const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const ytEmbed = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
