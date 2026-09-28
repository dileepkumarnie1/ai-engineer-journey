export type ISODate = string;

const pad = (n: number) => String(n).padStart(2, '0');

export const toISO = (d: Date): ISODate =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fromISO = (s: ISODate): Date => {
  const [y = 1970, m = 1, d = 1] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (s: ISODate, n: number): ISODate => {
  const d = fromISO(s);
  d.setDate(d.getDate() + n);
  return toISO(d);
};

/** Whole days from `a` to `b` (b − a). */
export const diffDays = (a: ISODate, b: ISODate): number =>
  Math.round((fromISO(b).getTime() - fromISO(a).getTime()) / 86_400_000);

export const weekday = (s: ISODate): number => fromISO(s).getDay();

export const todayISO = (): ISODate => toISO(new Date());

export const isISODate = (s: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) && toISO(fromISO(s)) === s;

export const formatShort = (s: ISODate): string =>
  fromISO(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export const formatLong = (s: ISODate): string =>
  fromISO(s).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
