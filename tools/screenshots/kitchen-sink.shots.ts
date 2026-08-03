import type { Page } from '@playwright/test';
import { DESKTOP, settle, shot, test } from './shot';

/**
 * The primitives on `/dev/kitchen-sink`, to compare against
 * `Sistema de diseño.dc.html`. Phase 2's, and what re-checks the primitives
 * when they change.
 *
 * Desktop only, and that is the point rather than an omission: the page exists
 * to show components against the reference, and every one of them looks the
 * same on both sides of the 900px breakpoint. What changes at mobile is the
 * shell, which has its own set.
 *
 * Between this file and `shell.shots.ts` sit the four techniques that aren't
 * obvious — opening an overlay, framing a shot a click would otherwise scroll
 * into a corner, capturing keyboard focus, clipping to a band. Copy from here.
 */

test.use(DESKTOP);

/** Puts a section flush at the top of the viewport. */
async function scrollToSection(page: Page, title: string) {
  await page
    .getByRole('heading', { name: title, exact: true })
    .evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await settle(page);
}

test('01 · surfaces and the type scale', async ({ page }) => {
  await page.goto('/dev/kitchen-sink');
  await settle(page);
  await scrollToSection(page, 'Surfaces');
  await shot(page, '01-surfaces');
});

test('02 · components in their states', async ({ page }) => {
  await page.goto('/dev/kitchen-sink');
  await settle(page);
  await scrollToSection(page, 'Components');
  await shot(page, '02-components');
});

test('03 · the rail and the firm grid', async ({ page }) => {
  await page.goto('/dev/kitchen-sink');
  await settle(page);
  await scrollToSection(page, 'Layout');
  await shot(page, '03-layout');
});

test('04 · modal', async ({ page }) => {
  await page.goto('/dev/kitchen-sink');
  await settle(page);
  await page.getByRole('button', { name: 'Abrir modal' }).click();
  await page.getByRole('dialog', { name: 'Registrar un pago' }).waitFor();
  await settle(page);
  await shot(page, '04-modal');
});

test('05 · filter menu with its search box', async ({ page }) => {
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
  await shot(page, '05-filter-menu');
});
