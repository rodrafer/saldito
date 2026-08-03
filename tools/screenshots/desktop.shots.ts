import type { Page } from '@playwright/test';
import { settle, shot, test } from './shot';

/**
 * Desktop shots — 1280×800, written at 2× (2560×1600 PNGs).
 *
 * The order is the order they go into the PR body, and the numeric prefix is
 * what keeps them in it: the directory is read by a human comparing shot 02
 * against shot 01.
 */

/** Puts a kitchen-sink section flush at the top of the viewport. */
async function scrollToSection(page: Page, title: string) {
  await page
    .getByRole('heading', { name: title, exact: true })
    .evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await settle(page);
}

test('01 · dashboard with the rail collapsed', async ({ page }) => {
  await page.goto('/');
  await settle(page);
  await shot(page, '01-desktop-dashboard');
});

test('02 · the rail expanded by keyboard', async ({ page }) => {
  await page.goto('/');
  await settle(page);

  /* Tabbing rather than `.focus()`: the gold ring is `:focus-visible`, which
     Chromium only grants to focus that arrived from the keyboard. A
     programmatic focus would expand the rail and show no ring — the exact
     thing this shot exists to prove. */
  const railItem = page.locator('.sd-sidebar__item').first();
  for (let i = 0; i < 5 && !(await railItem.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press('Tab');
  }
  await settle(page);
  await shot(page, '02-desktop-rail-expanded');
});

test('03 · kitchen sink · surfaces and the type scale', async ({ page }) => {
  await page.goto('/dev/kitchen-sink');
  await settle(page);
  await scrollToSection(page, 'Surfaces');
  await shot(page, '03-desktop-kitchen-sink-surfaces');
});

test('04 · kitchen sink · components in their states', async ({ page }) => {
  await page.goto('/dev/kitchen-sink');
  await settle(page);
  await scrollToSection(page, 'Components');
  await shot(page, '04-desktop-kitchen-sink-components');
});

test('05 · kitchen sink · the rail and the firm grid', async ({ page }) => {
  await page.goto('/dev/kitchen-sink');
  await settle(page);
  await scrollToSection(page, 'Layout');
  await shot(page, '05-desktop-kitchen-sink-layout');
});

test('06 · modal', async ({ page }) => {
  await page.goto('/dev/kitchen-sink');
  await settle(page);
  await page.getByRole('button', { name: 'Abrir modal' }).click();
  await page.getByRole('dialog', { name: 'Registrar un pago' }).waitFor();
  await settle(page);
  await shot(page, '06-desktop-modal');
});

test('07 · filter menu with its search box', async ({ page }) => {
  await page.goto('/dev/kitchen-sink');
  await settle(page);
  /* Framed from the card that owns the chip: clicking alone would let
     Playwright scroll only as far as it needs to, which cuts the card above
     in half and leaves the popover wherever it lands. */
  await page
    .getByText('Fields and menus', { exact: true })
    .evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await settle(page);
  /* The chip group above carries an "Impuestos" chip too, so the trigger is
     matched by the caret that only the filter chip has. */
  await page.getByRole('button', { name: 'Impuestos ▾' }).click();
  await page.getByPlaceholder('Buscar categoría').waitFor();
  await settle(page);
  await shot(page, '07-desktop-filter-menu');
});

test('08 · expenses on the firm grid, right column empty', async ({ page }) => {
  await page.goto('/gastos');
  await settle(page);
  await shot(page, '08-desktop-expenses-firm-grid');
});
