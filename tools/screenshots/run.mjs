#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * `npm run shots -- <dir> [file filter] [playwright flags]`
 *
 * Playwright's CLI reads bare arguments as test-file filters, so the
 * destination directory can't be passed straight through — it goes in as
 * `SHOTS_OUT` and everything after it is forwarded untouched. That forwarding
 * is what selects a set: a bare `auth` runs `auth.desktop.ts` and
 * `auth.mobile.ts`, `--project=mobile` cuts to one viewport, `-g 03` to one
 * shot.
 */
const [dir, ...forwarded] = process.argv.slice(2);

if (!dir || dir.startsWith('-')) {
  console.error(
    [
      'usage: npm run shots -- <output-dir> [file filter] [playwright flags]',
      '',
      'examples:',
      "  npm run shots -- ~/Documents/Images/dev-screenshots/saldito/'#7-my-branch'",
      '  npm run shots -- .screenshots design-system   # one set',
      '  npm run shots -- .screenshots --project=mobile',
      '',
      'the shots go to <output-dir>/<name>.png, overwriting what is there.',
      'a set is a file: tools/screenshots/<slug>.desktop.ts or <slug>.mobile.ts.',
    ].join('\n'),
  );
  process.exit(2);
}

/* `~` is expanded by the shell, but not when the argument is quoted — and it
   has to be quoted here, because the convention puts a `#` in the folder name
   and an unquoted `#` starts a comment. */
const out = resolve(dir.replace(/^~(?=$|\/)/, process.env.HOME ?? '~'));
mkdirSync(out, { recursive: true });

console.log(`Capturing into ${out}`);

const result = spawnSync('npx', ['playwright', 'test', ...forwarded], {
  stdio: 'inherit',
  env: { ...process.env, SHOTS_OUT: out },
});

if (result.status !== 0) {
  console.error(
    "\nIf that failed on a missing browser, the binary isn't a dependency:\n  npx playwright install chromium",
  );
}

process.exit(result.status ?? 1);
