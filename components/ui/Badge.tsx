import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

export type BadgeTone = 'positive' | 'negative' | 'neutral';

const TONE_CLASS: Record<BadgeTone, string> = {
  positive: 'sd-badge--positivo',
  negative: 'sd-badge--negativo',
  neutral: 'sd-badge--neutral',
};

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

/** Status pill. Positive = they owe you; negative = you owe. */
export function Badge({ tone = 'neutral', children, className }: BadgeProps) {
  return <span className={cn('sd-badge', TONE_CLASS[tone], className)}>{children}</span>;
}
