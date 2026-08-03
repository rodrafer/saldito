'use client';

import * as Menu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/cn';
import { useOverlayContainer } from './overlay-container';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Pure action menu: no text field inside.
 *
 * Menu semantics come with typeahead and roving tabindex, which fight any
 * input rendered inside them. Menus that carry a search box are `FilterMenu`
 * (a Popover) instead — see PLAN.md.
 *
 * Anchored to its trigger, not to the row. Closes on outside click and on
 * Escape, restores focus to the trigger, and only one is ever open.
 */
export const DropdownMenu = Menu.Root;

/** `asChild` so the trigger is whatever the caller renders — a Chip, a Button,
 *  a bare icon — with the handoff's classes, instead of a wrapper of Radix's. */
export function DropdownMenuTrigger({ children }: { children: ReactNode }) {
  return <Menu.Trigger asChild>{children}</Menu.Trigger>;
}

export interface DropdownMenuContentProps extends Omit<
  ComponentPropsWithoutRef<typeof Menu.Content>,
  'asChild'
> {
  /** Fixed width. Filter menus use 300px to match the right column. */
  width?: number | string;
}

export function DropdownMenuContent({
  width,
  className,
  style,
  align = 'start',
  sideOffset = 6,
  children,
  ...props
}: DropdownMenuContentProps) {
  const container = useOverlayContainer();

  return (
    <Menu.Portal container={container}>
      <Menu.Content
        align={align}
        sideOffset={sideOffset}
        className={cn('sd-dropdown', className)}
        style={width ? { width, ...style } : style}
        {...props}
      >
        {children}
      </Menu.Content>
    </Menu.Portal>
  );
}

export interface DropdownMenuItemProps extends Omit<
  ComponentPropsWithoutRef<typeof Menu.Item>,
  'asChild'
> {
  children: ReactNode;
}

export function DropdownMenuItem({ className, children, ...props }: DropdownMenuItemProps) {
  return (
    <Menu.Item className={cn('sd-dropdown__item', className)} {...props}>
      {children}
    </Menu.Item>
  );
}

/** For options that show their state, like a selected filter value. */
export function DropdownMenuCheckboxItem({
  className,
  children,
  ...props
}: Omit<ComponentPropsWithoutRef<typeof Menu.CheckboxItem>, 'asChild'>) {
  return (
    <Menu.CheckboxItem className={cn('sd-dropdown__item', className)} {...props}>
      {children}
      <Menu.ItemIndicator>✓</Menu.ItemIndicator>
    </Menu.CheckboxItem>
  );
}
