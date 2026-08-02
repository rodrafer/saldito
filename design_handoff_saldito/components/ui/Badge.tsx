import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

export type BadgeTono = 'positivo' | 'negativo' | 'neutral';

/** Píldora de estado. Positivo = te deben; negativo = debés. */
export function Badge({ tono = 'neutral', children, className }: { tono?: BadgeTono; children: ReactNode; className?: string }) {
  return <span className={cn('sd-badge', `sd-badge--${tono}`, className)}>{children}</span>;
}
