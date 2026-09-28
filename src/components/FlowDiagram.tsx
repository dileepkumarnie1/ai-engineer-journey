import { ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Fragment } from 'react';
import { cn } from '@/lib/cn';

/** Pictorial pipeline: concept steps as chips joined by arrows. */
export function FlowDiagram({ steps, dotClass = 'bg-violet-500' }: { steps: string[]; dotClass?: string }) {
  return (
    <ol className="flex flex-wrap items-center gap-2" aria-label="Concept flow">
      {steps.map((step, i) => (
        <Fragment key={step}>
          <motion.li
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium shadow-sm dark:border-white/10 dark:bg-white/5"
          >
            <span className={cn('grid size-5 place-items-center rounded-full text-[10px] font-bold text-white', dotClass)}>
              {i + 1}
            </span>
            {step}
          </motion.li>
          {i < steps.length - 1 && <ChevronRight aria-hidden className="size-4 text-slate-400" />}
        </Fragment>
      ))}
    </ol>
  );
}
