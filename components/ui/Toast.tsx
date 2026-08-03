'use client';

import { useEffect } from 'react';

/** Spec section 9 sets the confirmation at 2600ms. The handoff component said
 *  2400; the spec wins. */
export const TOAST_DURATION_MS = 2600;

export interface ToastProps {
  message: string | null;
  icon?: string;
  onClose: () => void;
  durationMs?: number;
}

/** Ephemeral confirmation. Shows above the bottom bar and leaves on its own. */
export function Toast({ message, icon, onClose, durationMs = TOAST_DURATION_MS }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs, onClose]);

  if (!message) return null;

  return (
    <div role="status" className="sd-toast">
      {icon && <span aria-hidden="true">{icon}</span>}
      {message}
    </div>
  );
}
