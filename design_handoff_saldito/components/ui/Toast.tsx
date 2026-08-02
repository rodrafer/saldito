'use client';
import { useEffect } from 'react';

export interface ToastProps {
  mensaje: string | null;
  icono?: string;
  onCerrar: () => void;
  duracion?: number;
}

/** Confirmación efímera. Aparece sobre la barra inferior y se va sola. */
export function Toast({ mensaje, icono, onCerrar, duracion = 2400 }: ToastProps) {
  useEffect(() => {
    if (!mensaje) return;
    const t = setTimeout(onCerrar, duracion);
    return () => clearTimeout(t);
  }, [mensaje, duracion, onCerrar]);

  if (!mensaje) return null;
  return (
    <div role="status" className="sd-toast">
      {icono && <span aria-hidden>{icono}</span>}
      {mensaje}
    </div>
  );
}
