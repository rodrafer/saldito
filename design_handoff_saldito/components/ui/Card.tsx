import { cn } from '@/lib/cn';
import type { HTMLAttributes, ReactNode } from 'react';

export type CardTono = 'neutral' | 'elevada' | 'dorada' | 'rosa';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tono?: CardTono;
  /** Sin padding interno: para listas que ocupan todo el ancho. */
  plano?: boolean;
  children: ReactNode;
}

/**
 * Superficie base. Todos los tonos usan un degradado a 155°
 * (más claro arriba-izquierda) para dar profundidad sobre el fondo.
 */
export function Card({ tono = 'neutral', plano = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn('sd-card', tono !== 'neutral' && `sd-card--${tono}`, plano && 'sd-card--plano', className)}
      {...props}
    >
      {children}
    </div>
  );
}
