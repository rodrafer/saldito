'use client';
import { cn } from '@/lib/cn';
import type { Pantalla } from '@/types';

export interface NavItem {
  id: Pantalla;
  icono: string;
  label: string;
}

export interface BottomNavProps {
  items: NavItem[];
  activa: Pantalla;
  onNavegar: (p: Pantalla) => void;
  /** Acción central destacada (FAB). */
  onFab?: () => void;
  className?: string;
}

/**
 * Barra flotante inferior: píldora despegada del borde con blur,
 * ítem activo sobre fondo dorado al 10% y FAB elevado en el centro.
 */
export function BottomNav({ items, activa, onNavegar, onFab, className }: BottomNavProps) {
  const mitad = Math.ceil(items.length / 2);
  const render = (item: NavItem) => (
    <div
      key={item.id}
      aria-current={item.id === activa ? 'page' : undefined}
      onClick={() => onNavegar(item.id)}
      className="sd-bottomnav__item"
    >
      <div style={{ fontSize: 18 }}>{item.icono}</div>
      <div className="sd-bottomnav__label">{item.label}</div>
    </div>
  );

  return (
    <nav className={cn('sd-bottomnav', className)}>
      {items.slice(0, mitad).map(render)}
      {onFab && (
        <button type="button" className="sd-fab" onClick={onFab} aria-label="Nueva acción">+</button>
      )}
      {items.slice(mitad).map(render)}
    </nav>
  );
}
