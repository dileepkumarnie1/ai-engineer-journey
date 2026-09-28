export const courseFormats = ['video', 'interactive', 'course', 'notebook', 'article', 'docs'] as const;
export type CourseFormat = (typeof courseFormats)[number];
