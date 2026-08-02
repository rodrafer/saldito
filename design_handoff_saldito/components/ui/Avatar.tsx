import { cn } from '@/lib/cn';
import { inicial } from '@/lib/formato';

export interface AvatarProps {
  nombre: string;
  tamano?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** Avatar de integrante: inicial sobre superficie dorada. Sin fotos. */
export function Avatar({ nombre, tamano = 'md', className }: AvatarProps) {
  return (
    <div className={cn('sd-avatar', tamano !== 'md' && `sd-avatar--${tamano}`, className)} aria-hidden>
      {inicial(nombre)}
    </div>
  );
}

/** Contenedor de emoji de categoría: mismo tamaño que el avatar, esquinas redondeadas. */
export function IconoCategoria({ icono, fondo, className }: { icono: string; fondo?: string; className?: string }) {
  return (
    <div className={cn('sd-avatar', 'sd-avatar--icono', className)} style={fondo ? { background: fondo } : undefined} aria-hidden>
      {icono}
    </div>
  );
}
