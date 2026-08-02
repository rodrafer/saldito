'use client';
import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

export interface ChipProps {
  activo?: boolean;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}

/** Chip de filtro. Activo = degradado dorado con texto oscuro. */
export function Chip({ activo = false, onClick, className, children }: ChipProps) {
  return (
    <button type="button" aria-pressed={activo} onClick={onClick} className={cn('sd-chip', className)}>
      {children}
    </button>
  );
}

/**
 * Fila de chips. En mobile SIEMPRE en una sola línea con scroll horizontal:
 * los filtros nunca deben pasar a un segundo renglón.
 */
export function ChipFila({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('sd-chip-fila', className)}>{children}</div>;
}
