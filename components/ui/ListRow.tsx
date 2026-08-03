'use client';

import { cn } from '@/lib/cn';
import type { ComponentPropsWithRef, ReactNode } from 'react';

export interface ListRowProps extends Omit<ComponentPropsWithRef<'button'>, 'title'> {
  left?: ReactNode;
  title: ReactNode;
  detail?: ReactNode;
  right?: ReactNode;
  /** Variant used in action sheets: full gold hover. */
  action?: boolean;
}

/**
 * Generic list row (expenses, members, notifications, options).
 * Minimum height 44px, to respect the touch target.
 *
 * The handoff hung `onClick` off a `div`, so the row was unreachable by
 * keyboard and invisible to assistive tech. A clickable row is a `<button>`
 * here; a row that only displays stays a `div` rather than becoming a button
 * that does nothing.
 *
 * Rest props go through to the button so a row can be a sheet's trigger under
 * `asChild` — see the note in Chip.tsx for why that matters.
 */
export function ListRow({
  left,
  title,
  detail,
  right,
  onClick,
  action = false,
  className,
  type = 'button',
  ...props
}: ListRowProps) {
  const body = (
    <>
      {left}
      <div className="sd-row__body">
        <div className="sd-row__title">{title}</div>
        {detail && <div className="sd-row__detail">{detail}</div>}
      </div>
      {right}
    </>
  );

  const classes = cn('sd-row', action && 'sd-row--action', !onClick && 'sd-row--static', className);

  if (!onClick) {
    return <div className={classes}>{body}</div>;
  }

  return (
    <button type={type} onClick={onClick} className={classes} {...props}>
      {body}
    </button>
  );
}
