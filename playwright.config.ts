/**
 * Playwright is here for **screenshots**, not for tests.
 *
 * The run produces the images a PR needs, so it is development tooling and it
 * does not belong in CI: nothing here asserts anything, and a red capture run
 * would block a merge over a shot nobody had looked at yet. E2E tests are a
 * separate item in `PLAN.md`, with their own commitment to CI time and
 * flakiness — and that is also where visual regression would go if it ever
 * arrives. Comparing two runs is a different tool from taking one.
 *
 * What is durable here is the driver, not the shot list. Which captures a PR
 * needs is decided by that PR — see `AGENTS.md`. Sets come and go; a file
 * called `<subject>.shots.ts` is all a new one has to be to get picked up, and
 * it declares its own viewports with `test.use(DESKTOP)` / `test.use(MOBILE)`.
 *
 * It runs against `next dev` on purpose. `/dev/kitchen-sink` is a page only in
 * development — `pageExtensions` in `next.config.ts` counts `*.dev.tsx` only
 * when `NODE_ENV` is `development` — so the whole kitchen-sink set is missing
 * from a production build.
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tools/screenshots',
  testMatch: /\.shots\.ts$/,
  /* One shot at a time: several of them scroll or open an overlay on the same
     route, and parallel workers would each pay for a cold dev-server compile. */
  workers: 1,
  fullyParallel: false,
  /* A capture that needed a retry is a capture that can't be trusted. */
  retries: 0,
  reporter: [['list']],
  /* The first hit on a route compiles it; that is slower than a warm page load
     by an order of magnitude. */
  timeout: 60_000,
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:3000',
    /* Retina, like the machine the design was reviewed on: a 1280×800 shot
       lands as a 2560×1600 PNG.
       It goes *after* the preset, which sets `deviceScaleFactor` itself — put
       it before and every capture silently comes out at 1×. */
    deviceScaleFactor: 2,
  },
  /* No `projects`. The viewport belongs to the shot, and a file says so with
     `test.use(…)`; making it a project would put it back in the file name and
     split every subject across two lists. */
});
