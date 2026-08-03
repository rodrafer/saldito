'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { NavItem } from './BottomNav';
import type { ReactNode } from 'react';

export interface SidebarProps {
  items: NavItem[];
  /** Current route. The shell reads it from the router and passes it down. */
  activeHref: string;
  /** Sits at the top of the rail: group picker + new expense. */
  header?: ReactNode;
  /** Sits at the bottom, anchored: notifications and profile. */
  footer?: ReactNode;
  className?: string;
}

/**
 * Collapsed side rail (64px) that expands to 212px on hover.
 *
 * Rules:
 * - No collapse button and no persisted state: hover only.
 * - The rail is a surface of its own (155° gradient, 18px radius) floating over
 *   the background, not a bordered column.
 * - It expands **over** the content (`position: absolute` inside a fixed gap of
 *   --sd-sidebar-hueco, 76px), so opening it causes no reflow.
 * - The icons live in 44px boxes that don't move as it expands; only the
 *   labels fade in.
 * - The active item gets the diagonal gold gradient and no border.
 *
 * Expanding is `:hover` and `:focus-within` in CSS rather than React state:
 * the handoff drove it from onMouseEnter/onMouseLeave, which leaves the rail
 * permanently collapsed for anyone navigating by keyboard. Tabbing into it now
 * opens it the same way the mouse does.
 */
export function Sidebar({ items, activeHref, header, footer, className }: SidebarProps) {
  return (
    <div className="sd-sidebar-hueco">
      <aside className={cn('sd-sidebar', className)}>
        {header}
        <nav aria-label="Navegación principal" className="sd-sidebar__items">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.href === activeHref ? 'page' : undefined}
              className="sd-sidebar__item"
            >
              <span className="sd-sidebar__icono" aria-hidden="true">
                {item.icon}
              </span>
              <span className="sd-sidebar__label">{item.label}</span>
            </Link>
          ))}
        </nav>
        {footer && <div className="sd-sidebar__pie">{footer}</div>}
      </aside>
    </div>
  );
}
