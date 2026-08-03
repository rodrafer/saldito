import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

export interface DesktopGridProps {
  /** Left column: the screen's main content. */
  children: ReactNode;
  /**
   * Right column, fixed at 300px. Required on purpose — pass `null` when the
   * screen has nothing to put there. The column still gets rendered: the rule
   * is that it stays even when empty, so the main column keeps the same width
   * from screen to screen and the headers line up over the panel below.
   */
  aside: ReactNode;
  className?: string;
}

/**
 * The firm desktop grid: `1fr 300px` with a 20px gap.
 *
 * Every desktop screen uses it, empty right column included. Screen headers
 * use it too, which is what puts their right-hand controls exactly over the
 * panel underneath.
 *
 * Below the breakpoint the right column stacks under the main one — the firm
 * grid is a desktop rule, and 300px next to anything on a 390px screen isn't a
 * grid, it's an overflow.
 */
export function DesktopGrid({ children, aside, className }: DesktopGridProps) {
  return (
    <div className={cn('sd-desktop-grid', className)}>
      <div className="min-w-0">{children}</div>
      <div className="min-w-0">{aside}</div>
    </div>
  );
}
