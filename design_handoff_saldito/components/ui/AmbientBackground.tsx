import type { ReactNode } from 'react';

/**
 * Fondo de la app: dos luminiscencias radiales sobre el negro base.
 * La dorada se centra al 85% de la altura y se derrama por los laterales;
 * la rosa entra desde la esquina superior izquierda.
 * Va SIEMPRE en el contenedor raíz, nunca por pantalla.
 */
export function AmbientBackground({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={className}
      style={{
        minHeight: '100dvh',
        background: 'var(--sd-bloom-dorado), var(--sd-bloom-rosa), var(--sd-bg-app)',
        backgroundAttachment: 'fixed',
        color: 'var(--sd-text)',
        fontFamily: 'var(--sd-font)',
      }}
    >
      {children}
    </div>
  );
}
