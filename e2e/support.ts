/**
 * What every e2e spec starts from: the viewports, the locators that cannot be
 * written by role, and a fixture that fails a test whose page logged an error.
 *
 * The screenshot harness has a sibling of this file — `tools/screenshots/shot.ts`
 * — and they deliberately do not share code. One exists to produce an image a
 * human judges; this one exists to assert. The only technique worth carrying
 * across is `parkPointer`, and it is four lines.
 */
import { test as base, expect, type Locator, type Page } from '@playwright/test';

/** The two sides of the 900px breakpoint, for `test.use(…)`. */
export const DESKTOP = { viewport: { width: 1280, height: 800 } };
export const MOBILE = { viewport: { width: 390, height: 760 } };

/**
 * The shell's two navigation envelopes.
 *
 * Located by class rather than by role, which is the exception and not the
 * habit: both are `<nav aria-label="Navegación principal">`, because they are
 * the same navigation rendered twice with CSS choosing one. That makes the
 * role-and-name query ambiguous *by construction* — and the ambiguity is the
 * design, so disambiguating on visibility would just hide what these tests are
 * here to check.
 */
export const rail = (page: Page) => page.locator('.sd-sidebar');
export const bottomBar = (page: Page) => page.locator('.sd-bottomnav');

/** The app container. Every overlay is supposed to portal inside this. */
export const appContainer = (page: Page) => page.locator('.sd-app');

/**
 * Move the pointer somewhere harmless.
 *
 * Playwright's mouse starts at the top-left corner, which on desktop is exactly
 * where the rail is — and the rail expands on `:hover` as well as on
 * `:focus-within`. Without this, a test that means to prove *keyboard*
 * expansion can pass on a hover it never asked for. The top-right corner is
 * background at both viewports.
 */
export async function parkPointer(page: Page) {
  const viewport = page.viewportSize();
  if (viewport) await page.mouse.move(viewport.width - 1, 1);
}

/** Fonts loaded, and the layout they shifted already painted. Before measuring. */
export async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}

/**
 * Press Tab until `target` holds focus. Throws rather than give up quietly.
 *
 * Focus has to *arrive* by keyboard for the behaviour under test to be the real
 * one: `:focus-visible` is only granted to focus Chromium believes came from a
 * key press, and the rail's expansion hangs off `:focus-within` on a real focus
 * move. `locator.focus()` would produce a state no keyboard user can reach.
 */
export async function tabTo(page: Page, target: Locator, maxPresses = 10) {
  const holdsFocus = () => target.evaluate((el) => el === document.activeElement);
  for (let i = 0; i < maxPresses && !(await holdsFocus()); i++) {
    await page.keyboard.press('Tab');
  }
  if (!(await holdsFocus())) {
    throw new Error(`${maxPresses} tabs did not reach the target`);
  }
}

/**
 * Asserts that focus is still inside `container` after each of `presses` tabs.
 *
 * Walks past the end of the container's own focusables, so the cycle has to
 * come back around instead of escaping into the page behind. The count has to
 * exceed what is inside.
 *
 * **This proves the loop, not the trap** — see `expectFocusRecapturedFrom`.
 */
export async function expectFocusLoopsIn(page: Page, container: Locator, presses = 12) {
  for (let i = 0; i < presses; i++) {
    await page.keyboard.press('Tab');
    const inside = await container.evaluate((el) => el.contains(document.activeElement));
    expect(inside, `focus left the container after ${i + 1} tab(s)`).toBe(true);
  }
}

/**
 * Asserts that focus moved onto `outside` is pulled back into `container`.
 *
 * Radix's `FocusScope` takes `loop` and `trapped` as separate props, and its
 * Tab handler runs when **either** is set — so a scope that only loops is
 * indistinguishable from one that traps as long as you navigate by Tab. Only
 * the trap installs the `focusin` listener that recaptures focus moved any
 * other way: a stray `.focus()` from an effect, a late-arriving autofocus, a
 * click on the content behind.
 *
 * Without this, `expectFocusLoopsIn` passes on a non-modal dialog, and the
 * distinction Radix is here to provide goes unchecked.
 */
export async function expectFocusRecapturedFrom(container: Locator, outside: Locator) {
  await outside.focus();

  await expect
    .poll(() => container.evaluate((el) => el.contains(document.activeElement)), {
      message: 'focus was moved outside and never came back',
    })
    .toBe(true);
}

/**
 * The base test, extended so that **any** page error fails the test that caused
 * it.
 *
 * This is the cheapest assertion in the suite and the one most likely to catch
 * something: a hydration mismatch is a `console.error` and nothing else. It
 * does not throw, it does not change what renders, and jsdom cannot see it at
 * all — so without this it would reach production having passed every check in
 * the repo. `AppShell` renders both navigation envelopes rather than measuring
 * the window specifically to avoid one; this is what holds that decision in
 * place.
 *
 * Collected and asserted at teardown rather than thrown on arrival: the error
 * shows up asynchronously, and a test that already failed on its own assertion
 * gives a better message than one interrupted mid-step.
 */
export const test = base.extend<{ failOnPageErrors: void }>({
  failOnPageErrors: [
    async ({ page }, use) => {
      const problems: string[] = [];

      page.on('pageerror', (error) => problems.push(`uncaught: ${error.message}`));
      page.on('console', (message) => {
        if (message.type() === 'error') problems.push(`console.error: ${message.text()}`);
      });

      await use();

      expect(problems, 'the page reported errors').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
