import type { Variants } from 'motion/react';

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export const rise: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 140, damping: 20 } },
};

export const cardHover = { y: -4, transition: { type: 'spring', stiffness: 300, damping: 20 } } as const;
