'use client';

import { useRef } from 'react';

/**
 * Sends focus back to whatever opened the dialog once it closes.
 *
 * Radix's modal Dialog restores focus to `Dialog.Trigger` and nothing else: it
 * calls `preventDefault()` on the close event — which cancels the focus scope's
 * own restore — and then focuses `triggerRef`. Our `Sheet` and `Modal` are
 * driven by `open`/`onOpenChange` so they can be opened from anywhere (a row, a
 * menu item, a keyboard shortcut), and never render a `Trigger`. That leaves
 * `triggerRef` null, the focus call a no-op, and focus on `<body>` — back to
 * the top of the page, which is the exact failure Radix was brought in to
 * avoid, and one no screenshot would ever show.
 *
 * The element is captured in `onOpenAutoFocus`, which the focus scope fires
 * *before* it moves focus into the dialog, so `document.activeElement` is still
 * the opener at that point. No effects, no ordering to get wrong.
 */
export function useReturnFocus() {
  const openerRef = useRef<HTMLElement | null>(null);

  return {
    onOpenAutoFocus: () => {
      openerRef.current = document.activeElement as HTMLElement | null;
    },
    onCloseAutoFocus: (event: Event) => {
      const opener = openerRef.current;
      /* If the opener is gone — a row that closed with its own sheet — let
         Radix have the event rather than focusing a detached node. */
      if (!opener || !opener.isConnected) return;
      event.preventDefault();
      opener.focus();
    },
  };
}
