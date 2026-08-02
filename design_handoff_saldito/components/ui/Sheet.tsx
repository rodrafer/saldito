'use client';
import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

export interface SheetProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Bottom sheet (patrón mobile). Entra con sd-sheet-up sobre un overlay
 * que cierra al hacer click. Se ancla al contenedor de la app, no al viewport.
 */
export function Sheet({ abierto, onCerrar, titulo, children, className }: SheetProps) {
  if (!abierto) return null;
  return (
    <>
      <div className="sd-overlay" onClick={onCerrar} />
      <div role="dialog" aria-modal="true" aria-label={titulo} className={cn('sd-sheet', className)}>
        <div className="sd-sheet__handle" />
        {titulo && (
          <div style={{ fontSize: 'var(--sd-fs-subtitulo)', fontWeight: 600, marginBottom: 14 }}>{titulo}</div>
        )}
        {children}
      </div>
    </>
  );
}
