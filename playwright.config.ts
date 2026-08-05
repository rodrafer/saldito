/**
 * The **e2e suite**. Screenshots are a different run with a different config —
 * `playwright.shots.config.ts` — and the two share nothing but the dependency.
 * This one owns the default name because it is the one that gates a merge: a
 * bare `npx playwright test` should run tests, not write PNGs somewhere.
 *
 * What belongs in here, and what belongs in Vitest instead, is in `AGENTS.md`.
 * The short version: this suite is for behaviour that only exists in a real
 * browser. Everything else is cheaper as a unit test and belongs there.
 *
 * ## It runs against `next dev`, and that is not the long-term answer
 *
 * Sheet, modal and filter menu have no surface in the app yet — their only
 * caller is `/dev/kitchen-sink`, which `pageExtensions` in `next.config.ts`
 * makes a route *only* under `next dev`. Against a production build that page
 * does not exist, so most of this suite would have nothing to drive. Once
 * phases 4 and 5 ship real filter rows and real modals, this should move to
 * `next build && next start` and start testing what actually ships.
 *
 * The cost of dev in the meantime is the on-demand compile of each route,
 * which is why the timeout is generous. It is a first-hit cost, not a per-test
 * one.
 *
 * ## Animations, and the trap phase 2 lost an hour to
 *
 * A hidden tab does not dispatch `animationend`, so Radix's `Presence` never
 * completes and an overlay looks stuck open. Headless Chromium reports every
 * page as visible, so the default run is safe — but `--headed` with more than
 * one worker puts pages in background windows, and the close tests will hang
 * there for reasons that have nothing to do with the code. Debug with
 * `--headed --workers=1`.
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  /* Top level, and deliberately not under `tests/`: that directory is inside
     Vitest's include glob, so a `.spec.ts` written there would be picked up by
     both runners — and the jsdom half can never pass. */
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  /* No retries, here or in the capture config. A test that passes on the
     second try is a test nobody can read a result from, and retries turn that
     into a green tick. If something here is flaky it should be loud. */
  retries: 0,
  /* Fails a run that got left with a `.only`. */
  forbidOnly: !!process.env.CI,
  /* The first hit on a route compiles it, which is slower than a warm load by
     an order of magnitude. This is headroom for that, not permission to wait. */
  timeout: 60_000,
  expect: { timeout: 5_000 },
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    /* Locally, reuse whatever is already serving. In CI there is never a
       server to reuse, and reusing one would mean testing a stale build. */
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:3000',
    /* With no retries this is the only forensics a CI failure leaves behind,
       which is what makes "no retries" affordable. */
    trace: 'retain-on-failure',
  },
  /* No `projects`: the viewport belongs to the test. A `describe` says which
     side of the 900px breakpoint it is on with `test.use(DESKTOP | MOBILE)`,
     the same way a shot file does. */
});
