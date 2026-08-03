'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * The element overlays portal into.
 *
 * The handoff anchors sheets, modals, dropdowns and toasts with
 * `position: absolute` against the app container, not the viewport. Radix
 * portals to `document.body` by default, which would drop them outside that
 * container and break every one of those offsets — the sheet in particular
 * would slide up from the bottom of the document instead of the app.
 *
 * `AmbientBackground` publishes its own node here and the overlay primitives
 * read it. `null` is a valid value: Radix falls back to `document.body`, which
 * is what we want for anything rendered outside the shell.
 */
const OverlayContainerContext = createContext<HTMLElement | null>(null);

export function OverlayContainerProvider({
  value,
  children,
}: {
  value: HTMLElement | null;
  children: ReactNode;
}) {
  return (
    <OverlayContainerContext.Provider value={value}>{children}</OverlayContainerContext.Provider>
  );
}

export function useOverlayContainer(): HTMLElement | null {
  return useContext(OverlayContainerContext);
}
