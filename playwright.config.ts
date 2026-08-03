/**
 * Playwright is here for **screenshots**, not for tests.
 *
 * The run produces the images a PR needs, so it is development tooling and it
 * does not belong in CI: nothing here asserts anything, and a red capture run
 * would block a merge over a shot nobody had looked at yet. E2E tests are a
 * separate item in `PLAN.md`, with their own commitment to CI time and
 * flakiness.
 *
 * What is durable here is the driver, not the shot list. Which captures a PR
 * needs is decided by that PR — see `AGENTS.md`. Shot files come and go;
 * `<slug>.desktop.ts` and `<slug>.mobile.ts` is all a new set has to be called
 * to get picked up.
 *
 * It runs against `next dev` on purpose. `/dev/kitchen-sink` is a page only in
 * development — `pageExtensions` in `next.config.ts` counts `*.dev.tsx` only
 * when `NODE_ENV` is `development` — so five of the eleven shots do not exist
 * in a production build.
 */
import { defineConfig, devices } from '@playwright/test';

/**
 * Retina, like the machine the design was reviewed on: a 1280×800 shot lands
 * as a 2560×1600 PNG.
 *
 * It belongs to each project rather than to the shared `use` block: a project's
 * `use` replaces the shared one key by key, and the `devices` presets set
 * `deviceScaleFactor` themselves — so a shared value here is silently
 * overwritten back to 1.
 */
const RETINA = { ...devices['Desktop Chrome'], deviceScaleFactor: 2 };

export default defineConfig({
  testDir: './tools/screenshots',
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
    baseURL: 'http://localhost:3000',
  },
  projects: [
    {
      name: 'desktop',
      testMatch: /\.desktop\.ts$/,
      use: { ...RETINA, viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile',
      testMatch: /\.mobile\.ts$/,
      /* Phone width, but not a phone preset: `devices['iPhone …']` carries a
         touch flag and a scale factor of its own. The breakpoint that decides
         the layout is 900px, and the shot has to be as legible as the desktop
         ones. */
      use: { ...RETINA, viewport: { width: 390, height: 760 } },
    },
  ],
});
