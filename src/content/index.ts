import { phases } from './phases';
import type { Course, LearningModule, Phase } from './schema';

export { phases };
export * from './extras';
export type * from './schema';

export const allModules: LearningModule[] = phases.flatMap((p) => p.modules);
export const corePhases: Phase[] = phases.filter((p) => !p.buffer);
export const coreModules: LearningModule[] = corePhases.flatMap((p) => p.modules);

const moduleById = new Map(allModules.map((m) => [m.id, m]));
const phaseByModuleId = new Map(phases.flatMap((p) => p.modules.map((m) => [m.id, p] as const)));

export const getModule = (id: string) => moduleById.get(id);
export const getPhaseOfModule = (id: string) => phaseByModuleId.get(id);
export const getPhase = (id: string) => phases.find((p) => p.id === id);

export interface CourseEntry {
  course: Course;
  modules: LearningModule[];
}

// Courses can be shared across modules; dedupe for the library view.
export const courseLibrary: CourseEntry[] = (() => {
  const map = new Map<string, CourseEntry>();
  for (const m of allModules) {
    for (const course of m.courses) {
      const entry = map.get(course.id) ?? { course, modules: [] };
      entry.modules.push(m);
      map.set(course.id, entry);
    }
  }
  return [...map.values()];
})();

export const getCourse = (id: string) => courseLibrary.find((e) => e.course.id === id)?.course;
