'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';

export interface NavItem {
  href: string;
  /** Emoji or glyph. Decorative: the label is the accessible name. */
  icon: string;
  label: string;
}

export interface BottomNavProps {
  items: NavItem[];
  /** Current route. The shell reads it from the router and passes it down. */
  activeHref: string;
  /** Centre-stage action (FAB). */
  onFab?: () => void;
  fabLabel?: string;
  className?: string;
}

/**
 * Floating bottom bar: a pill lifted off the edge with blur, the active item
 * on gold at 10%, and a raised FAB in the middle.
 *
 * Icons only, no captions. `components.css` and the design-system page draw a
 * 10.5px label under each icon, but the prototype — which the handoff makes
 * the tiebreaker — has none. The label survives as the accessible name, so
 * nothing is lost to assistive tech. See HANDOFF_NOTES.md.
 */
export function BottomNav({ items, activeHref, onFab, fabLabel, className }: BottomNavProps) {
  const half = Math.ceil(items.length / 2);

  const renderItem = (item: NavItem) => (
    <Link
      key={item.href}
      href={item.href}
      aria-current={item.href === activeHref ? 'page' : undefined}
      className="sd-bottomnav__item"
    >
      <span aria-hidden="true">{item.icon}</span>
      <span className="sr-only">{item.label}</span>
    </Link>
  );

  return (
    <nav aria-label="Navegación principal" className={cn('sd-bottomnav', className)}>
      {items.slice(0, half).map(renderItem)}
      {onFab && (
        <button
          type="button"
          className="sd-fab sd-bottomnav__fab"
          onClick={onFab}
          aria-label={fabLabel ?? 'Nueva acción'}
        >
          <span aria-hidden="true">+</span>
        </button>
      )}
      {items.slice(half).map(renderItem)}
    </nav>
  );
}
