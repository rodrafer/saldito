import { cn } from '@/lib/cn';
import type { HTMLAttributes, ReactNode } from 'react';

export type CardTone = 'neutral' | 'elevated' | 'gold' | 'pink';

const TONE_CLASS: Record<Exclude<CardTone, 'neutral'>, string> = {
  elevated: 'sd-card--elevada',
  gold: 'sd-card--dorada',
  pink: 'sd-card--rosa',
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
  /** No inner padding: for lists that run the full width. */
  flat?: boolean;
  children: ReactNode;
}

/**
 * Base surface. Every tone uses a 155° gradient (lighter at the top-left) to
 * read as depth against the background.
 */
export function Card({ tone = 'neutral', flat = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'sd-card',
        tone !== 'neutral' && TONE_CLASS[tone],
        flat && 'sd-card--plano',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
