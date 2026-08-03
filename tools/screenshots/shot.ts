import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test as base, type Page } from '@playwright/test';

/**
 * Where the PNGs go. `tools/screenshots/run.mjs` sets it from its argument;
 * the default only exists so a bare `npx playwright test` still writes
 * somewhere harmless.
 */
const outDir = resolve(process.env.SHOTS_OUT ?? '.screenshots');

/** A capture is named once, here, and that name is what the PR heading points at. */
export async function shot(page: Page, name: string, clip?: Clip) {
  await mkdir(outDir, { recursive: true });

  /* Park the pointer before capturing. It stays wherever the last click left
     it, which is how the actions sheet came out with a gold hover on the row
     that happened to open under the FAB — a state no user would be in. The
     top-right corner is background on both viewports; the top-*left* is not,
     since hovering there expands the rail. */
  const viewport = page.viewportSize();
  if (viewport) await page.mouse.move(viewport.width - 1, 1);

  await page.screenshot({
    path: resolve(outDir, `${name}.png`),
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

/* A shot of a broken page is still a valid PNG, and the run stays green while
   producing it. This is the only thing standing between that and a PR. */
test.beforeEach(({ page }) => {
  page.on('pageerror', (error) => console.error(`  ✗ page error: ${error.message}`));
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
