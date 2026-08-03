import { settle, shot, test } from './shot';

/**
 * Mobile shots — 390×760, written at 2× (780×1520 PNGs).
 *
 * Below the 900px breakpoint the rail is gone and the floating bar is in, so
 * these are a different envelope around the same content, not a narrower
 * version of the desktop ones.
 */

test('09 · dashboard', async ({ page }) => {
  await page.goto('/');
  await settle(page);
  await shot(page, '09-mobile-dashboard');
});

test('10 · floating bar and FAB', async ({ page }) => {
  await page.goto('/');
  await settle(page);

  /* Clipped to the bottom of the viewport rather than shot whole: what this
     one has to show — the 16px lift, the blur, gold at 10% on the active item
     and the raised FAB — is a 60px band that nobody can judge inside a
     full-height phone screenshot. */
  const bar = await page.locator('.sd-bottomnav').boundingBox();
  const viewport = page.viewportSize();
  if (!bar) throw new Error('the floating bar is not visible at this viewport');
  if (!viewport) throw new Error('no viewport: the clip has nothing to measure against');
  await shot(page, '10-mobile-bottom-bar-fab', {
    x: 0,
    y: bar.y - 24,
    width: viewport.width,
    height: viewport.height - bar.y + 24,
  });
});

test('11 · the actions bottom sheet', async ({ page }) => {
  await page.goto('/');
  await settle(page);
  await page.getByRole('button', { name: 'Nueva acción' }).click();
  await page.getByRole('dialog', { name: '¿Qué querés hacer?' }).waitFor();
  await settle(page);
  await shot(page, '11-mobile-actions-sheet');
});
