'use client';

import { AlertTriangle, CircleDot, Minus } from 'lucide-react';
import type { Risk } from '@/lib/types';

const style: Record<Risk, string> = {
  alto: 'bg-rose-200 text-rose-900 dark:bg-rose-900/50 dark:text-rose-200',
  medio: 'bg-amber-200 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200',
  bajo: 'bg-zinc-200 text-zinc-700 dark:bg-ink-700 dark:text-zinc-300',
};

const Icon: Record<Risk, typeof AlertTriangle> = {
  alto: AlertTriangle,
  medio: CircleDot,
  bajo: Minus,
};

export default function RiskBadge({ risk }: { risk: Risk }) {
  const I = Icon[risk];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${style[risk]}`}
      title={`Riesgo en la entrevista: ${risk}`}
      aria-label={`Riesgo ${risk}`}
    >
      <I size={11} aria-hidden /> {risk}
    </span>
  );
}
