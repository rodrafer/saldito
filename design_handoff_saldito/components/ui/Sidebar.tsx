'use client';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { Pantalla } from '@/types';
import type { ReactNode } from 'react';

export interface SidebarProps {
  items: { id: Pantalla; icono: string; label: string }[];
  activa: Pantalla;
  onNavegar: (p: Pantalla) => void;
  /** Va arriba del rail: selector de grupo + botón de nuevo gasto. */
  encabezado?: ReactNode;
  /** Va abajo, anclado: notificaciones y perfil. */
  pie?: ReactNode;
  className?: string;
}

/**
 * Rail lateral colapsado (64px) que se expande a 212px al pasar el mouse.
 *
 * Reglas:
 * - No hay botón de colapsar ni estado persistido: sólo hover.
 * - El rail es una superficie propia (degradado 155°, radio 20px) flotando
 *   sobre el fondo, no una columna con borde.
 * - Se expande **por encima** del contenido (`position: absolute` dentro de
 *   un hueco fijo de 88px), así no hay reflow al abrir.
 * - Los íconos viven en cajas de 44px que no se mueven al expandir; sólo
 *   aparecen las etiquetas (`opacity`).
 * - El ítem activo lleva contenedor con degradado dorado diagonal y borde
 *   dorado al 32%.
 */
export function Sidebar({ items, activa, onNavegar, encabezado, pie, className }: SidebarProps) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div
      className="sd-sidebar-hueco"
      onMouseEnter={() => setAbierto(true)}
      onMouseLeave={() => setAbierto(false)}
    >
      <aside className={cn('sd-sidebar', abierto && 'sd-sidebar--abierto', className)}>
        {encabezado}
        <nav className="sd-sidebar__items">
          {items.map((item) => (
            <div
              key={item.id}
              aria-current={item.id === activa ? 'page' : undefined}
              onClick={() => onNavegar(item.id)}
              className="sd-sidebar__item"
            >
              <span className="sd-sidebar__icono">{item.icono}</span>
              <span className="sd-sidebar__label">{item.label}</span>
            </div>
          ))}
        </nav>
        <div className="sd-sidebar__pie">{pie}</div>
      </aside>
    </div>
  );
}
