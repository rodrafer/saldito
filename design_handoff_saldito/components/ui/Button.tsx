'use client';
import { cn } from '@/lib/cn';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariante = 'primario' | 'secundario' | 'fantasma' | 'peligro';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: ButtonVariante;
  tamano?: 'sm' | 'md';
  bloque?: boolean;
  children: ReactNode;
}

/** Botón. El primario es el único con el degradado dorado: uno por vista. */
export function Button({
  variante = 'primario', tamano = 'md', bloque = false, className, children, ...props
}: ButtonProps) {
  return (
    <button
      className={cn('sd-btn', `sd-btn--${variante}`, tamano === 'sm' && 'sd-btn--sm', bloque && 'sd-btn--bloque', className)}
      {...props}
    >
      {children}
    </button>
  );
}
