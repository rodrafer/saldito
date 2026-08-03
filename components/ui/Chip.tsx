'use client';

import * as Toggle from '@radix-ui/react-toggle';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { cn } from '@/lib/cn';
import type { ComponentPropsWithRef, ReactNode } from 'react';

/**
 * The rest props are not decoration: a chip is the trigger for the filter
 * menus, and `asChild` works by cloning this element with Radix's own props on
 * it — the click handler, `aria-expanded`, the id it anchors to, the ref. A
 * component that destructures only what it knows drops all of that on the
 * floor, and `asChild` fails silently: the markup looks right and the menu
 * never opens. Forwarding the rest onto the DOM node is what makes it work.
 */
export interface ChipProps extends ComponentPropsWithRef<typeof Toggle.Root> {
  children: ReactNode;
}

/**
 * Standalone filter chip. Active = gold gradient with dark text.
 *
 * Radix Toggle sets `aria-pressed` and `data-state`; components.css styles the
 * active state off either, so the same class covers this and the group items.
 */
export function Chip({ className, children, ...props }: ChipProps) {
  return (
    <Toggle.Root className={cn('sd-chip', className)} {...props}>
      {children}
    </Toggle.Root>
  );
}

/**
 * Chip row. On mobile ALWAYS a single line with horizontal scroll: the filters
 * must never wrap onto a second line.
 *
 * Layout only — it holds `Chip`s, `ChipGroup`s or filter-menu triggers alike.
 */
export function ChipRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('sd-chip-row', className)}>{children}</div>;
}

export interface ChipGroupProps {
  /** Multi-select: every pressed chip is in the array. */
  value: string[];
  onValueChange: (value: string[]) => void;
  label: string;
  className?: string;
  children: ReactNode;
}

/**
 * Multi-select chip row. Radix ToggleGroup adds roving tabindex, so the whole
 * group is one tab stop and the arrows move within it.
 */
export function ChipGroup({ value, onValueChange, label, className, children }: ChipGroupProps) {
  return (
    <ToggleGroup.Root
      type="multiple"
      value={value}
      onValueChange={onValueChange}
      aria-label={label}
      className={cn('sd-chip-row', className)}
    >
      {children}
    </ToggleGroup.Root>
  );
}

export interface ChipGroupItemProps extends ComponentPropsWithRef<typeof ToggleGroup.Item> {
  children: ReactNode;
}

export function ChipGroupItem({ className, children, ...props }: ChipGroupItemProps) {
  return (
    <ToggleGroup.Item className={cn('sd-chip', className)} {...props}>
      {children}
    </ToggleGroup.Item>
  );
}
