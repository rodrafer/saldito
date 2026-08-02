'use client';
import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

export interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo?: string;
  ancho?: number;
  children: ReactNode;
  className?: string;
}

/** Equivalente desktop del Sheet: mismo contenido, centrado y con pop-in. */
export function Modal({ abierto, onCerrar, titulo, ancho = 420, children, className }: ModalProps) {
  if (!abierto) return null;
  return (
    <>
      <div className="sd-overlay" onClick={onCerrar} />
      <div role="dialog" aria-modal="true" aria-label={titulo} className={cn('sd-modal', className)} style={{ width: ancho }}>
        {titulo && (
          <div style={{ fontSize: 'var(--sd-fs-titulo-sm)', fontWeight: 600, marginBottom: 14 }}>{titulo}</div>
        )}
        {children}
      </div>
    </>
  );
}
