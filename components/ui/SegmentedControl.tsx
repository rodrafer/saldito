'use client';

import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { cn } from '@/lib/cn';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Names the group for assistive tech: "Vista de deudas", "Modo de reparto". */
  label: string;
  className?: string;
}

/**
 * Segmented control (2–3 options). On desktop it lines up with the 300px right
 * column, so it usually carries width: 300px.
 *
 * The handoff marked it up as `role="tablist"` with `role="tab"` children,
 * which promises tab panels that don't exist and leaves the control unusable
 * by keyboard. Radix ToggleGroup in single mode gives a real group of buttons
 * with roving tabindex: one tab stop, arrows to move between options.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      /* Radix hands back '' when the pressed item is toggled off. A segmented
         control always has exactly one option chosen, so that's ignored. */
      onValueChange={(next) => {
        if (next) onChange(next as T);
      }}
      aria-label={label}
      className={cn('sd-segmented', className)}
    >
      {options.map((option) => (
        <ToggleGroup.Item key={option.value} value={option.value} className="sd-segmented__item">
          {option.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
