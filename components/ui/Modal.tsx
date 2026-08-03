'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { cn } from '@/lib/cn';
import { useOverlayContainer } from './overlay-container';
import { useReturnFocus } from './use-return-focus';
import type { ReactNode } from 'react';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  /** Read out after the title. Not rendered. */
  description?: string;
  width?: number;
  children: ReactNode;
  className?: string;
}

/**
 * Desktop counterpart of the Sheet: same content, centred, with a pop-in.
 * 420px by default.
 *
 * Same Dialog as the Sheet — only the position and the animation differ.
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  width = 420,
  children,
  className,
}: ModalProps) {
  const container = useOverlayContainer();
  const returnFocus = useReturnFocus();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal container={container}>
        <Dialog.Overlay className="sd-overlay" />
        <Dialog.Content className={cn('sd-modal', className)} style={{ width }} {...returnFocus}>
          {title ? (
            <Dialog.Title className="sd-modal__title">{title}</Dialog.Title>
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

/** Closes the modal from inside — wraps whatever the caller renders. */
export function ModalClose({ children }: { children: ReactNode }) {
  return <Dialog.Close asChild>{children}</Dialog.Close>;
}
