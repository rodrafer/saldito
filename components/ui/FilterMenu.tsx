'use client';

import * as Popover from '@radix-ui/react-popover';
import { cn } from '@/lib/cn';
import { Input } from './Input';
import { useOverlayContainer } from './overlay-container';
import type { ComponentPropsWithoutRef, InputHTMLAttributes, ReactNode } from 'react';

/**
 * Filter menu: the kind that carries a search box.
 *
 * Deliberately a Popover and not a DropdownMenu. Menu semantics bring typeahead
 * and roving tabindex — every keystroke in a search field would be read as a
 * jump-to-item, and the field would never keep focus. A popover is just a
 * dismissable layer, so ordinary form controls behave normally inside it and
 * Escape still closes it with focus going back to the chip.
 *
 * Anchored to its own chip, 300px wide to match the right column.
 */
export const FilterMenu = Popover.Root;

export function FilterMenuTrigger({ children }: { children: ReactNode }) {
  return <Popover.Trigger asChild>{children}</Popover.Trigger>;
}

export interface FilterMenuContentProps extends Omit<
  ComponentPropsWithoutRef<typeof Popover.Content>,
  'asChild'
> {
  /** Names the menu for assistive tech: "Filtrar por categoría". */
  label: string;
  width?: number | string;
}

export function FilterMenuContent({
  label,
  width = 300,
  className,
  style,
  align = 'start',
  sideOffset = 6,
  children,
  ...props
}: FilterMenuContentProps) {
  const container = useOverlayContainer();

  return (
    <Popover.Portal container={container}>
      <Popover.Content
        align={align}
        sideOffset={sideOffset}
        aria-label={label}
        className={cn('sd-dropdown', className)}
        style={{ width, ...style }}
        {...props}
      >
        {children}
      </Popover.Content>
    </Popover.Portal>
  );
}

/** Search box inside the menu. Autofocuses: the menu opens to be typed into. */
export function FilterMenuSearch({
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & { className?: string }) {
  return (
    <div className={cn('sd-dropdown__buscador', className)}>
      <Input type="search" autoFocus {...props} />
    </div>
  );
}

export interface FilterMenuItemProps {
  selected?: boolean;
  onSelect: () => void;
  children: ReactNode;
  className?: string;
}

/** An option in the list. A real `<button>`, since a popover gives it no
 *  semantics of its own. */
export function FilterMenuItem({ selected, onSelect, children, className }: FilterMenuItemProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn('sd-dropdown__item', className)}
    >
      {children}
      {selected && <span aria-hidden="true">✓</span>}
    </button>
  );
}

/** Closes the menu from inside — wraps whatever the caller renders. */
export function FilterMenuClose({ children }: { children: ReactNode }) {
  return <Popover.Close asChild>{children}</Popover.Close>;
}
