#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

/**
 * `npm run shots -- <dir> [file filter] [playwright flags]`
 *
 * Playwright's CLI reads bare arguments as test-file filters, so the
 * destination directory can't be passed straight through — it goes in as
 * `SHOTS_OUT` and everything after it is forwarded untouched. That forwarding
 * is what selects a set: a bare `shell` runs `shell.shots.ts` and nothing
 * else, and `-g '02'` cuts that to one shot.
 */
const [dir, ...forwarded] = process.argv.slice(2);

if (!dir || dir.startsWith('-')) {
  console.error(
    [
      'usage: npm run shots -- <output-dir> [file filter] [playwright flags]',
      '',
      'examples:',
      "  npm run shots -- ~/Documents/Images/dev-screenshots/saldito/'#7-my-branch'",
      '  npm run shots -- .screenshots shell        # one set',
      "  npm run shots -- .screenshots shell -g '02'  # one shot, while iterating",
      '',
      'the shots go to <output-dir>/<name>.png, overwriting what is there.',
      'a set is a file: tools/screenshots/<subject>.shots.ts.',
    ].join('\n'),
  );
  process.exit(2);
}

/* `~` is expanded by the shell, but not when the argument is quoted — and it
   has to be quoted here, because the convention puts a `#` in the folder name
   and an unquoted `#` starts a comment. */
const out = resolve(dir.replace(/^~(?=$|\/)/, process.env.HOME ?? '~'));
mkdirSync(out, { recursive: true });

/* Checked here rather than guessed at from a failure: the browser is the one
   prerequisite that isn't installed by `npm ci`, and every other way a run goes
   red is a shot's own problem. */
if (!existsSync(chromium.executablePath())) {
  console.error("the chromium binary isn't a dependency — install it once per machine:");
  console.error('  npx playwright install chromium');
  process.exit(2);
}

console.log(`Capturing into ${out}`);

/* `--config` is not optional: the default config is the e2e suite's, so
   without this a capture run would execute the tests instead. */
const result = spawnSync(
  'npx',
  ['playwright', 'test', '--config=playwright.shots.config.ts', ...forwarded],
  {
    stdio: 'inherit',
    /* One timestamp for every worker, so a shot can tell "this run wrote that
     file" from "a previous run did", which is the difference between a name
     collision and an ordinary overwrite. */
    env: { ...process.env, SHOTS_OUT: out, SHOTS_RUN_STARTED_AT: String(Date.now()) },
  },
);

process.exit(result.status ?? 1);
