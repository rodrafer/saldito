'use client';
import { cn } from '@/lib/cn';
import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

/** Campo de texto. El foco se marca sólo con el borde dorado, sin halo. */
export function Input({ label, className, id, ...props }: InputProps) {
  return (
    <div>
      {label && <label className="sd-label" htmlFor={id}>{label}</label>}
      <input id={id} className={cn('sd-input', className)} {...props} />
    </div>
  );
}
