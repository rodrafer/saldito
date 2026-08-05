/**
 * The app shell: the two navigation envelopes, and the FAB.
 *
 * This is the half of the suite that drives the real app. The overlays live in
 * `overlays.spec.ts`, against the kitchen sink, because they have no caller in
 * the app yet.
 *
 * Note what is **not** here: `activeHrefFor` — the rule that `/gastos/nuevo`
 * still lights up Gastos — is a pure function over a string, and belongs in
 * Vitest the moment a nested route exists to feed it. What these tests are for
 * is the part that needs a browser: that the pathname actually reaches the
 * component after a client-side navigation, and that CSS picks one envelope.
 */
import type { Locator, Page } from '@playwright/test';
import {
  test,
  expect,
  DESKTOP,
  MOBILE,
  rail,
  bottomBar,
  parkPointer,
  settle,
  tabTo,
} from './support';

const ROUTES = [
  { href: '/', label: 'Dashboard' },
  { href: '/gastos', label: 'Gastos' },
  { href: '/deudas', label: 'Deudas' },
  { href: '/grupo', label: 'Grupo' },
];

/**
 * Walks the four routes through one envelope's links, checking after each hop
 * that the URL, the heading and `aria-current` all agree.
 *
 * Navigating by click rather than by `goto` is the point: `AppShell` reads the
 * pathname from `usePathname`, so a `goto` would prove only that the server
 * rendered the right thing. What can actually break is the client-side
 * transition leaving `aria-current` on the previous entry.
 */
async function walkRoutes(page: Page, nav: Locator) {
  for (const route of ROUTES) {
    await nav.getByRole('link', { name: route.label }).click();

    await expect(page).toHaveURL(route.href);
    await expect(page.getByRole('heading', { level: 1, name: route.label })).toBeVisible();

    for (const other of ROUTES) {
      const link = nav.getByRole('link', { name: other.label });
      if (other.href === route.href) {
        await expect(link).toHaveAttribute('aria-current', 'page');
      } else {
        await expect(link).not.toHaveAttribute('aria-current', 'page');
      }
    }
  }
}

test.describe('desktop', () => {
  test.use(DESKTOP);

  test('the rail navigates the four routes and aria-current follows the pathname', async ({
    page,
  }) => {
    await page.goto('/');
    await parkPointer(page);

    await expect(rail(page)).toBeVisible();
    await walkRoutes(page, rail(page));
  });

  test('the rail is the only navigation envelope', async ({ page }) => {
    await page.goto('/');

    await expect(rail(page)).toBeVisible();
    await expect(bottomBar(page)).toBeHidden();
  });

  test('tabbing into the rail expands it, and the content column does not move', async ({
    page,
  }) => {
    await page.goto('/');
    /* Both halves of this test depend on the pointer being nowhere near the
       rail: it expands on `:hover` as readily as on `:focus-within`, so a
       parked pointer is what makes the expansion attributable to the keyboard.
       Playwright would otherwise leave the mouse at (0, 0) — on the rail. */
    await parkPointer(page);
    await settle(page);

    const contentBefore = await page.locator('.sd-content').boundingBox();
    await expect(rail(page)).toHaveCSS('width', '64px');

    await tabTo(page, rail(page).getByRole('link', { name: 'Dashboard' }));

    /* Web-first, so it rides out the 0.24s width transition without a sleep:
       the assertion retries until the computed value settles, and fails on its
       own timeout if the rail never opens. */
    await expect(rail(page)).toHaveCSS('width', '212px');

    /* The whole point of the fixed 76px gap: the rail expands *over* the
       content. If this ever reflows, every screen jumps sideways when someone
       tabs in. */
    expect(await page.locator('.sd-content').boundingBox()).toEqual(contentBefore);
  });
});

test.describe('mobile', () => {
  test.use(MOBILE);

  test('the bottom bar navigates the four routes and aria-current follows the pathname', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(bottomBar(page)).toBeVisible();
    await walkRoutes(page, bottomBar(page));
  });

  test('the bottom bar is the only navigation envelope', async ({ page }) => {
    await page.goto('/');

    await expect(bottomBar(page)).toBeVisible();
    await expect(rail(page)).toBeHidden();
  });

  test('the FAB opens the actions sheet, and Escape gives focus back to it', async ({ page }) => {
    await page.goto('/');

    const fab = page.getByRole('button', { name: 'Nueva acción' });
    await fab.click();

    const sheet = page.getByRole('dialog', { name: '¿Qué querés hacer?' });
    await expect(sheet).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    /* The failure this guards against is focus landing on `<body>`, which sends
       a screen reader back to the top of the page after every sheet. See
       `use-return-focus.ts`: Radix restores to `Dialog.Trigger`, and the shell
       never renders one. */
    await expect(fab).toBeFocused();
  });
});
