import { DESKTOP, MOBILE, settle, shot, test } from './shot';

/**
 * The app shell: the rail on desktop, the floating bar on mobile, and the firm
 * grid every screen sits in.
 *
 * Phase 2's, and the set to re-run when the shell changes — the one case where
 * comparing against a previous PR's images is the point. Nobody else has to
 * reproduce it: a PR captures what shows its own work.
 *
 * The numbers are this set's own running order, the order it goes into a PR
 * body. They restart in every file and mean nothing outside one.
 */

test.describe('desktop', () => {
  test.use(DESKTOP);

  test('01 · dashboard with the rail collapsed', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    await shot(page, '01-dashboard');
  });

  test('02 · the rail expanded by keyboard', async ({ page }) => {
    await page.goto('/');
    await settle(page);

    /* Tabbing rather than `.focus()`: the gold ring is `:focus-visible`, which
       Chromium only grants to focus that arrived from the keyboard. A
       programmatic focus would expand the rail and show no ring — the exact
       thing this shot exists to prove. */
    const railItem = page.locator('.sd-sidebar__item').first();
    const focused = () => railItem.evaluate((el) => el === document.activeElement);
    for (let i = 0; i < 5 && !(await focused()); i++) {
      await page.keyboard.press('Tab');
    }
    /* Without this the shot degrades quietly into a collapsed rail with no
       ring, which is a picture of the bug it is meant to prove is fixed. */
    if (!(await focused())) throw new Error('five tabs did not reach the rail');
    await settle(page);
    await shot(page, '02-rail-expanded');
  });

  test('03 · expenses on the firm grid, right column empty', async ({ page }) => {
    await page.goto('/gastos');
    await settle(page);
    await shot(page, '03-expenses-firm-grid');
  });
});

test.describe('mobile', () => {
  test.use(MOBILE);

  test('04 · dashboard', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    await shot(page, '04-mobile-dashboard');
  });

  test('05 · floating bar and FAB', async ({ page }) => {
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
    await shot(page, '05-mobile-bottom-bar-fab', {
      x: 0,
      y: bar.y - 24,
      width: viewport.width,
      height: viewport.height - bar.y + 24,
    });
  });

  test('06 · the actions bottom sheet', async ({ page }) => {
    await page.goto('/');
    await settle(page);
    await page.getByRole('button', { name: 'Nueva acción' }).click();
    await page.getByRole('dialog', { name: '¿Qué querés hacer?' }).waitFor();
    await settle(page);
    await shot(page, '06-mobile-actions-sheet');
  });
});
