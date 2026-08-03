import { existsSync, statSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test as base, type Page } from '@playwright/test';

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
