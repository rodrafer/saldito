'use client';
import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

export interface ListRowProps {
  izquierda?: ReactNode;
  titulo: ReactNode;
  detalle?: ReactNode;
  derecha?: ReactNode;
  onClick?: () => void;
  /** Variante usada en las hojas de acción: hover dorado completo. */
  accion?: boolean;
  className?: string;
}

/**
 * Fila de lista genérica (gastos, integrantes, notificaciones, opciones).
 * Altura mínima 44px para respetar el target táctil.
 */
export function ListRow({ izquierda, titulo, detalle, derecha, onClick, accion = false, className }: ListRowProps) {
  return (
    <div className={cn('sd-row', accion && 'sd-row--accion', className)} onClick={onClick}>
      {izquierda}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--sd-fs-body-lg)', fontWeight: 600 }}>{titulo}</div>
        {detalle && (
          <div style={{ fontSize: 'var(--sd-fs-label)', color: 'var(--sd-text-atenuado)', marginTop: 2 }}>{detalle}</div>
        )}
      </div>
      {derecha}
    </div>
  );
}
