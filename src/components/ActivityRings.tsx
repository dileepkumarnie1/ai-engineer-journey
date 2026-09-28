import { motion } from 'motion/react';
import { useId, type ReactNode } from 'react';

export interface Ring {
  value: number;
  from: string;
  to: string;
  label: string;
}

/** Concentric animated progress rings (outer ring first). */
export function ActivityRings({
  rings,
  size = 200,
  stroke = 16,
  gap = 5,
  children,
}: {
  rings: Ring[];
  size?: number;
  stroke?: number;
  gap?: number;
  children?: ReactNode;
}) {
  const uid = `rings${useId().replace(/[^\w-]/g, '')}`;
  const c = size / 2;
  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      role="img"
      aria-label={rings.map((r) => `${r.label} ${Math.round(r.value * 100)}%`).join(', ')}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          {rings.map((r, i) => (
            <linearGradient key={r.label} id={`${uid}-${i}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={r.from} />
              <stop offset="100%" stopColor={r.to} />
            </linearGradient>
          ))}
        </defs>
        {rings.map((r, i) => {
          const radius = c - stroke / 2 - i * (stroke + gap);
          return (
            <g key={r.label}>
              <circle cx={c} cy={c} r={radius} fill="none" stroke={r.from} strokeOpacity={0.2} strokeWidth={stroke} />
              <motion.circle
                cx={c}
                cy={c}
                r={radius}
                fill="none"
                stroke={`url(#${uid}-${i})`}
                strokeWidth={stroke}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: Math.max(0.001, Math.min(1, r.value)) }}
                transition={{ duration: 1.6, delay: 0.3 + i * 0.18, ease: [0.16, 1, 0.3, 1] }}
              />
            </g>
          );
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
