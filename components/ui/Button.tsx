'use client';

import { cn } from '@/lib/cn';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

/** Props are English; the classes keep the handoff's names. See docs/glossary.md. */
const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'sd-btn--primario',
  secondary: 'sd-btn--secundario',
  ghost: 'sd-btn--fantasma',
  danger: 'sd-btn--peligro',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  children: ReactNode;
}

/** Button. The primary one is the only one with the gold gradient: one per view. */
export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  className,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'sd-btn',
        VARIANT_CLASS[variant],
        size === 'sm' && 'sd-btn--sm',
        block && 'sd-btn--bloque',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
