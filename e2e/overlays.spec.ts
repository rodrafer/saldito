/**
 * Sheet, modal and filter menu — the behaviours Radix was brought in to
 * provide, and the ones phase 2 could only sign off by hand.
 *
 * Every one of them fails silently. There is no stack trace for focus landing
 * on `<body>`, for a search field that loses focus on the first keystroke, or
 * for an overlay portalled to `document.body` and therefore anchored to the
 * wrong box. They are also all invisible to a screenshot and unreachable from
 * jsdom, which is what makes them worth a browser.
 *
 * These drive `/dev/kitchen-sink` because it is the only caller these
 * primitives have: the app's own overlay is the actions sheet, and that one is
 * covered in `shell.spec.ts` against the real thing. When phases 4 and 5 give
 * the modal and the filter menu real callers, these should move onto them.
 */
import type { Locator, Page } from '@playwright/test';
import { test, expect, DESKTOP, appContainer, expectFocusTrappedIn, parkPointer } from './support';

test.use(DESKTOP);

test.beforeEach(async ({ page }) => {
  await page.goto('/dev/kitchen-sink');
  await parkPointer(page);
});

declare global {
  interface Window {
    /** Set by `exitAnimationOf`, read back after the close. */
    __exitAnimation?: Promise<string>;
  }
}

/**
 * The name of the animation that runs on the way out, captured by listening for
 * it before anything triggers the close.
 *
 * Radix's `Presence` decides an exit animation is running by comparing the
 * previous `animation-name` to the current one — so a single keyframe played in
 * reverse reads as "no change" and the element unmounts instantly, with no
 * error and no visible exit. The invariant is that the two names differ, and
 * the honest way to check it is to watch the animation start rather than to
 * sample a computed style and hope the element is still attached.
 *
 * Registration is an **awaited** call, with the promise parked on `window` so
 * that reading it is a second one. The obvious shape — hold the promise the
 * `evaluate` returns, then close while it is still in flight — loses the race
 * every time: the locator has to be resolved over the wire before the listener
 * is attached at all, and Escape arrives first. That failure is a good one to
 * know about, because it looks exactly like a missing exit animation.
 *
 * The in-page timeout only makes a genuinely broken exit fail in two seconds
 * rather than hang until the test times out. Nothing waits on it when the test
 * passes.
 */
async function exitAnimationOf(content: Locator, close: () => Promise<void>) {
  await content.evaluate((el) => {
    window.__exitAnimation = new Promise<string>((resolve) => {
      /* Cast because Playwright hands the callback an `SVGElement | HTMLElement`,
         and the union misses the event map that would type this as an
         `AnimationEvent`. */
      el.addEventListener(
        'animationstart',
        (event) => resolve((event as AnimationEvent).animationName),
        { once: true },
      );
      setTimeout(() => resolve('(no exit animation started)'), 2_000);
    });
  });

  await close();

  return content.page().evaluate(() => window.__exitAnimation!);
}

test.describe('sheet', () => {
  const open = async (page: Page) => {
    await page.getByRole('button', { name: 'Abrir sheet' }).click();
    const sheet = page.getByRole('dialog', { name: '¿Qué querés hacer?' });
    await expect(sheet).toBeVisible();
    return sheet;
  };

  test('Escape closes it and focus returns to whatever opened it', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Abrir sheet' });
    const sheet = await open(page);

    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('focus stays inside while it is open', async ({ page }) => {
    const sheet = await open(page);

    /* More presses than the sheet has focusables, so the walk goes past the end
       and proves the cycle wraps instead of escaping to the page behind. */
    await expectFocusTrappedIn(page, sheet);
  });

  test('the rest of the app is inert while it is open, and recovers on close', async ({ page }) => {
    const content = page.locator('main.sd-content');
    const sheet = await open(page);

    await expect(content).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('body')).toHaveAttribute('data-scroll-locked', '1');

    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();

    /* The unwind matters as much as the lock. A sheet that leaves the app
       `aria-hidden` makes every later screen unreadable to a screen reader,
       and the app looks perfectly fine. */
    await expect(content).not.toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('body')).not.toHaveAttribute('data-scroll-locked', '1');
  });

  test('it portals into .sd-app, not document.body', async ({ page }) => {
    const sheet = await open(page);

    /* The handoff anchors overlays with `position: absolute` against the app
       container. Portalled to `document.body` the sheet would still look
       plausible — it would just slide up from the bottom of the document
       instead of the bottom of the app. */
    await expect(sheet).toHaveJSProperty('parentElement.className', 'sd-app');
    expect(await appContainer(page).locator('.sd-sheet').count()).toBe(1);
  });

  test('the exit animation runs before it unmounts', async ({ page }) => {
    const sheet = await open(page);
    const enter = await sheet.evaluate((el) => getComputedStyle(el).animationName);

    const exit = await exitAnimationOf(sheet, () => page.keyboard.press('Escape'));

    expect(exit).not.toBe(enter);
    expect(exit).not.toContain('no exit animation');
  });
});

test.describe('modal', () => {
  const open = async (page: Page) => {
    await page.getByRole('button', { name: 'Abrir modal' }).click();
    /* By role and name: "Registrar un pago" is also a list row on this page,
       and a plain text query would match both. */
    const modal = page.getByRole('dialog', { name: 'Registrar un pago' });
    await expect(modal).toBeVisible();
    return modal;
  };

  test('Escape closes it and focus returns to whatever opened it', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Abrir modal' });
    const modal = await open(page);

    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('focus stays inside while it is open', async ({ page }) => {
    const modal = await open(page);

    await expectFocusTrappedIn(page, modal);
  });

  test('it portals into .sd-app, not document.body', async ({ page }) => {
    const modal = await open(page);

    await expect(modal).toHaveJSProperty('parentElement.className', 'sd-app');
  });

  test('the exit animation runs before it unmounts', async ({ page }) => {
    const modal = await open(page);
    const enter = await modal.evaluate((el) => getComputedStyle(el).animationName);

    const exit = await exitAnimationOf(modal, () => page.keyboard.press('Escape'));

    expect(exit).not.toBe(enter);
    expect(exit).not.toContain('no exit animation');
  });
});

test.describe('filter menu', () => {
  /* The chip reads "Impuestos ▾" because a category is selected by default.
     The caret is the disambiguator: a chip-group item on the same page is also
     called "Impuestos". */
  const chipName = 'Impuestos ▾';

  const open = async (page: Page) => {
    await page.getByRole('button', { name: chipName }).click();
    const menu = page.getByRole('dialog', { name: 'Filtrar por categoría' });
    await expect(menu).toBeVisible();
    return menu;
  };

  test('the search field takes focus on open and keeps it while typing', async ({ page }) => {
    const menu = await open(page);
    const search = menu.getByPlaceholder('Buscar categoría…');

    await expect(search).toBeFocused();

    /* This is the whole reason the filter menu is a Popover and not a
       DropdownMenu. Menu semantics bring typeahead and a roving tabindex, which
       read every keystroke as a jump-to-item and take focus off the field — so
       the second character would land somewhere else, or nowhere. Asserting the
       value *and* the focus is what separates "it kept focus" from "it happened
       to receive the keystrokes". */
    await page.keyboard.type('serv');

    await expect(search).toBeFocused();
    await expect(search).toHaveValue('serv');
    await expect(menu.getByRole('button', { name: /Servicios/ })).toBeVisible();
    await expect(menu.getByRole('button', { name: /Impuestos/ })).toBeHidden();
  });

  test('Escape closes it and focus returns to the chip', async ({ page }) => {
    const chip = page.getByRole('button', { name: chipName });
    const menu = await open(page);

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(chip).toBeFocused();
  });

  test('it portals into .sd-app, not document.body', async ({ page }) => {
    const menu = await open(page);

    /* Unlike the dialogs, a popover sits inside Radix's positioning wrapper, so
       the assertion is about the container it ended up under rather than its
       immediate parent. */
    await expect(menu).toHaveJSProperty('isConnected', true);
    expect(await menu.evaluate((el) => !!el.closest('.sd-app'))).toBe(true);
  });
});
