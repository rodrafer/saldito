'use client';
import { cn } from '@/lib/cn';

export interface SegmentedOption<T extends string> {
  valor: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  opciones: SegmentedOption<T>[];
  valor: T;
  onChange: (valor: T) => void;
  className?: string;
}

/**
 * Control segmentado (2–3 opciones). En desktop se alinea con la
 * columna derecha de 300px, así que suele llevar width: 300px.
 */
export function SegmentedControl<T extends string>({ opciones, valor, onChange, className }: SegmentedControlProps<T>) {
  return (
    <div role="tablist" className={cn('sd-segmented', className)}>
      {opciones.map((o) => (
        <div
          key={o.valor}
          role="tab"
          aria-selected={o.valor === valor}
          onClick={() => onChange(o.valor)}
          className="sd-segmented__item"
        >
          {o.label}
        </div>
      ))}
    </div>
  );
}
