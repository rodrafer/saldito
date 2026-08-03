'use client';

import { useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { BottomNav, Sidebar, type NavItem } from '@/components/ui';
import { ActionsSheet } from './ActionsSheet';

/**
 * The app's navigation, in the order the rail shows it. Emoji only: the design
 * rules out an icon library, so the glyphs come from the operating system.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: '/', icon: '⌂', label: 'Dashboard' },
  { href: '/gastos', icon: '≣', label: 'Gastos' },
  { href: '/deudas', icon: '⇄', label: 'Deudas' },
  { href: '/grupo', icon: '⚙', label: 'Grupo' },
];

/** Which nav entry a route lights up. `/gastos/nuevo` still belongs to Gastos. */
function activeHrefFor(pathname: string, items: NavItem[]): string {
  const match = items
    .filter((item) => item.href !== '/' && pathname.startsWith(item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.href ?? '/';
}

export interface AppShellProps {
  children: ReactNode;
  items?: NavItem[];
  /** Top of the rail: group picker + new expense. */
  sidebarHeader?: ReactNode;
  /** Bottom of the rail, anchored: notifications and profile. */
  sidebarFooter?: ReactNode;
  /** Overrides the FAB's default, which is to open the actions sheet. */
  onFab?: () => void;
  fabLabel?: string;
}

/**
 * Same content, different envelope: the rail on desktop, the floating bar on
 * mobile. Both are always rendered and CSS picks one, so the first paint is
 * already right — measuring the window in JS would mean a wrong frame on every
 * load and a hydration mismatch on top.
 *
 * The height comes from `.sd-app`, which is exactly one viewport tall and
 * doesn't scroll; the content column scrolls inside it. That's what keeps the
 * bottom bar pinned and the handoff's absolutely-positioned overlays anchored
 * to the app rather than to the end of the document.
 */
export function AppShell({
  children,
  items = NAV_ITEMS,
  sidebarHeader,
  sidebarFooter,
  onFab,
  fabLabel,
}: AppShellProps) {
  const pathname = usePathname();
  const activeHref = activeHrefFor(pathname, items);
  const [actionsOpen, setActionsOpen] = useState(false);

  return (
    <div className="flex h-full">
      <Sidebar
        items={items}
        activeHref={activeHref}
        header={sidebarHeader}
        footer={sidebarFooter}
      />
      <main className="sd-content">{children}</main>
      <BottomNav
        items={items}
        activeHref={activeHref}
        onFab={onFab ?? (() => setActionsOpen(true))}
        fabLabel={fabLabel ?? 'Nueva acción'}
      />
      {!onFab && <ActionsSheet open={actionsOpen} onOpenChange={setActionsOpen} />}
    </div>
  );
}
