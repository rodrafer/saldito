/**
 * The screenshot harness: how to take a correct picture of this app.
 *
 * What to capture is decided per PR and the shot files are not tracked — see
 * `AGENTS.md`. What lives here is the part that isn't per-PR, because each of
 * these was learned by getting it wrong, and every one of them fails by
 * producing a plausible image rather than an error: a shot at 1×, of the
 * fallback typeface, mid-animation, or with a hover no user would be in.
 *
 * ## Four things that aren't obvious
 *
 * **Keyboard focus has to arrive by keyboard.** `:focus-visible` is only granted
 * to focus Chromium believes came from the keyboard, so `locator.focus()`
 * produces the focused state with no ring — a picture of the bug the shot exists
 * to prove is fixed. `tabTo` below presses Tab until it lands, and throws rather
 * than degrade quietly.
 *
 * **Frame before you click, not after.** Playwright scrolls only as far as it
 * needs to in order to click, so whatever sits above ends up cut at an arbitrary
 * line. Scroll the section that owns the control to the top first —
 * `el.scrollIntoView({ block: 'start' })` — and the frame is yours.
 *
 * **Wait for the overlay by role and name**, not by timeout: `click()`, then
 * `getByRole('dialog', { name }).waitFor()`, then `settle`. And when two
 * elements share a name — a filter chip and a chip-group item both reading
 * "Impuestos" — disambiguate on something only one has, like the caret.
 *
 * **A thin band needs `clipOf`.** A floating bar is 60px of a 760px phone
 * screenshot, and nobody can judge a 16px lift or a blur at that scale. Clip to
 * the element and its surroundings instead of shrinking the evidence.
 */
import { existsSync, statSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test as base, type Locator, type Page } from '@playwright/test';

/**
 * Where the PNGs go. `tools/screenshots/run.mjs` sets it from its argument;
 * the default only exists so a bare `npx playwright test` still writes
 * somewhere harmless.
 */
const outDir = resolve(process.env.SHOTS_OUT ?? '.screenshots');

/**
 * The two sides of the 900px breakpoint, for `test.use(…)` at the top of a file
 * or of a `describe` block.
 *
 * A viewport is a property of a shot, not of a file: a set is a subject, and
 * most subjects have something to show on both sides. Naming files by viewport
 * would split every subject in two and make each of those files "the list" for
 * that width, which is the thing every PR would then have to edit.
 */
export const DESKTOP = { viewport: { width: 1280, height: 800 } };
export const MOBILE = { viewport: { width: 390, height: 760 } };

/**
 * When this run began, so a shot can tell a file it is overwriting from one
 * this same run already wrote. Numbers restart in every set, so two sets landing
 * in one directory collide on the slug alone — and the loser of that race just
 * isn't there, with a green run and no gap anyone would notice until the PR.
 */
const runStartedAt = Number(process.env.SHOTS_RUN_STARTED_AT ?? Date.now());

/** A capture is named once, here, and that name is what the PR heading points at. */
export async function shot(page: Page, name: string, clip?: Clip) {
  await mkdir(outDir, { recursive: true });

  const path = resolve(outDir, `${name}.png`);
  if (existsSync(path) && statSync(path).mtimeMs >= runStartedAt) {
    throw new Error(`two shots in this run are both called ${name}.png`);
  }

  /* Park the pointer before capturing. It stays wherever the last click left
     it, which is how the actions sheet came out with a gold hover on the row
     that happened to open under the FAB — a state no user would be in. The
     top-right corner is background on both viewports; the top-*left* is not,
     since hovering there expands the rail. */
  const viewport = page.viewportSize();
  if (viewport) await page.mouse.move(viewport.width - 1, 1);

  await page.screenshot({
    path,
    /* Overlays animate in. Without this the shot can land mid-transition,
       which reads as a wrong opacity or a wrong offset rather than as a
       timing artifact. */
    animations: 'disabled',
    clip,
  });
  console.log(`  → ${name}.png`);
}

interface Clip {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const test = base;

/**
 * A page that threw still screenshots fine, and the shot goes into a PR looking
 * like every other one. Nothing else in this run would catch it: there are no
 * assertions here by design, so an uncaught exception is the one failure the
 * captures can't show.
 *
 * Collected rather than thrown on the spot — the error arrives asynchronously,
 * and failing the shot it actually broke is worth more than failing whichever
 * one was in flight.
 */
const pageErrors: Error[] = [];

test.beforeEach(({ page }) => {
  pageErrors.length = 0;
  page.on('pageerror', (error) => pageErrors.push(error));
});

test.afterEach(() => {
  if (pageErrors.length > 0) {
    throw new Error(`the page threw while capturing:\n  ${pageErrors.join('\n  ')}`);
  }
});

/**
 * Call after every navigation and before the first `shot`: fonts loaded and
 * the layout they changed already painted.
 *
 * Archivo is self-hosted through `next/font`, so it arrives as a request like
 * any other and a shot taken before it lands is a shot of the fallback face.
 */
export async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  /* Two frames: one for the layout the fonts just changed, one to paint it. */
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
}

/**
 * Tab until `target` holds focus, so the shot shows a real `:focus-visible`
 * state. See the note at the top for why `locator.focus()` won't do.
 *
 * Throws instead of returning quietly: a shot that silently didn't reach the
 * target is a picture of the unfocused state, and it goes into a PR looking
 * like every other one.
 */
export async function tabTo(page: Page, target: Locator, maxPresses = 10) {
  const holdsFocus = () => target.evaluate((el) => el === document.activeElement);
  for (let i = 0; i < maxPresses && !(await holdsFocus()); i++) {
    await page.keyboard.press('Tab');
  }
  if (!(await holdsFocus())) {
    throw new Error(`${maxPresses} tabs did not reach the target`);
  }
  await settle(page);
}

/**
 * A clip around `target` and its surroundings, clamped to the viewport — for
 * anything whose point is a band rather than a page. See the note at the top.
 */
export async function clipOf(page: Page, target: Locator, padding = 24): Promise<Clip> {
  const box = await target.boundingBox();
  const viewport = page.viewportSize();
  if (!box) throw new Error('the target is not visible at this viewport');
  if (!viewport) throw new Error('no viewport: the clip has nothing to measure against');

  const x = Math.max(0, box.x - padding);
  const y = Math.max(0, box.y - padding);
  return {
    x,
    y,
    width: Math.min(viewport.width - x, box.width + padding * 2),
    height: Math.min(viewport.height - y, box.height + padding * 2),
  };
}
