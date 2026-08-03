'use client';

import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

/** Text field. Focus is marked with the gold border alone, no halo. */
export function Input({ label, className, id, ...props }: InputProps) {
  /** The handoff left the label unlinked when no id came in, which makes it
   *  decoration rather than a label. useId gives every field a real one. */
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div>
      {label && (
        <label className="sd-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input id={inputId} className={cn('sd-input', className)} {...props} />
    </div>
  );
}
