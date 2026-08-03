'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { cn } from '@/lib/cn';
import { useOverlayContainer } from './overlay-container';
import { useReturnFocus } from './use-return-focus';
import type { ReactNode } from 'react';

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  /** Read out after the title. Not rendered. */
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Bottom sheet (the mobile pattern). Enters with sd-sheet-up over an overlay
 * that closes on click. Anchored to the app container, not the viewport.
 *
 * Radix Dialog brings what the handoff version didn't have: Escape to close,
 * a focus trap, focus returned to whatever opened it, and the scroll lock.
 */
export function Sheet({ open, onOpenChange, title, description, children, className }: SheetProps) {
  const container = useOverlayContainer();
  const returnFocus = useReturnFocus();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={container}>
        <Dialog.Overlay className="sd-overlay sd-overlay--sheet" />
        <Dialog.Content className={cn('sd-sheet', className)} {...returnFocus}>
          <div className="sd-sheet__handle" />
          {/* A dialog has to be named, and the handoff makes the sheet's title
              optional. When there's none, the title still exists — just not on
              screen — instead of shipping an unnamed dialog. */}
          {title ? (
            <Dialog.Title className="sd-sheet__title">{title}</Dialog.Title>
          ) : (
            <VisuallyHidden asChild>
              <Dialog.Title>Opciones</Dialog.Title>
            </VisuallyHidden>
          )}
          {description && (
            <VisuallyHidden asChild>
              <Dialog.Description>{description}</Dialog.Description>
            </VisuallyHidden>
          )}
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Closes the sheet from inside — wraps whatever the caller renders. */
export function SheetClose({ children }: { children: ReactNode }) {
  return <Dialog.Close asChild>{children}</Dialog.Close>;
}
