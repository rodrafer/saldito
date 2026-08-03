'use client';

import { useState, type ReactNode } from 'react';
import { OverlayContainerProvider } from './overlay-container';

/**
 * App background: two radial blooms over the base black. The gold one is
 * centred at 85% of the height and spills sideways; the pink one comes in from
 * the top-left corner. Desktop swaps in its own, stronger pair — the canvas is
 * bigger there, so the mobile blooms wash out. All of it lives in `.sd-app`.
 *
 * Goes ALWAYS in the root container, never per screen.
 *
 * It doubles as the anchor for overlays: the handoff positions sheets, modals
 * and toasts against the app container rather than the viewport, so this
 * element is what Radix portals into.
 */
export function AmbientBackground({ children }: { children: ReactNode }) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  return (
    <div ref={setContainer} className="sd-app">
      <OverlayContainerProvider value={container}>{children}</OverlayContainerProvider>
    </div>
  );
}
