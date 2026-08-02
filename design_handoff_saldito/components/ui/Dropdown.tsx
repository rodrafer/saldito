'use client';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';
import type { ReactNode } from 'react';

export interface DropdownProps {
  abierto: boolean;
  onCerrar: () => void;
  /** Ancho fijo. Los menús de filtro usan 300px para igualar la columna derecha. */
  ancho?: number | string;
  children: ReactNode;
  className?: string;
}

/**
 * Menú anclado al disparador. El contenedor padre debe tener
 * position: relative — el dropdown se ancla a él, no a la fila.
 */
export function Dropdown({ abierto, onCerrar, ancho, children, className }: DropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const alClickAfuera = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onCerrar();
    };
    const alEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('mousedown', alClickAfuera);
    document.addEventListener('keydown', alEscape);
    return () => {
      document.removeEventListener('mousedown', alClickAfuera);
      document.removeEventListener('keydown', alEscape);
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;
  return (
    <div ref={ref} role="menu" className={cn('sd-dropdown', className)} style={ancho ? { width: ancho } : undefined}>
      {children}
    </div>
  );
}

export function DropdownItem({ seleccionado, onClick, children }: { seleccionado?: boolean; onClick?: () => void; children: ReactNode }) {
  return (
    <div role="menuitem" aria-selected={seleccionado} onClick={onClick} className="sd-dropdown__item">
      {children}
    </div>
  );
}
