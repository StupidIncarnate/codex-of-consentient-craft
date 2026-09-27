/**
 * Runs the consumer's own installed binaries — `dungeonmaster`, `dungeonmaster-ward`, `eslint`,
 * `tsc`, `jest` — exactly the way a real user's shell would (`node_modules/.bin/<name>`), never by
 * importing this repo's own compiled output. That is the whole point of this suite: prove the
 * PACKED, INSTALLED artifact works, not that this checkout's source still does.
 */

import { join } from 'node:path';
import { run } from './proc.mjs';

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

const binPath = ({ consumerRoot, name }) => join(consumerRoot, 'node_modules', '.bin', name);

export const runDungeonmasterInit = ({ consumerRoot }) =>
  run({
    command: binPath({ consumerRoot, name: 'dungeonmaster' }),
    args: ['init'],
    cwd: consumerRoot,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  });

export const runWard = ({ consumerRoot, args = [], cwd }) =>
  run({
    command: binPath({ consumerRoot, name: 'dungeonmaster-ward' }),
    args,
    cwd: cwd ?? consumerRoot,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  });

// `--fix` matches what ward's own `check-run-lint-broker` always passes — without it, this
// standalone probe lands on a much LARGER, pre-autofix violation set (every auto-fixable
// `no-unnecessary-type-assertion`/`curly` finding included) instead of the true final residual,
// which is what made F1's own recorded shape (6 files) diverge from a first, un-fixed measurement
// here (30+ files) against the identical source.
export const runEslint = ({ consumerRoot, cwd, args = ['.'] }) =>
  run({
    command: binPath({ consumerRoot, name: 'eslint' }),
    args: [...args, '--fix', '--format', 'json'],
    cwd,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  });

export const runTsc = ({ consumerRoot, cwd, args = ['-p', 'tsconfig.json', '--noEmit'] }) =>
  run({
    command: binPath({ consumerRoot, name: 'tsc' }),
    args,
    cwd,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  });

export const runJest = ({ consumerRoot, cwd, args = [] }) =>
  run({
    command: binPath({ consumerRoot, name: 'jest' }),
    args,
    cwd,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  });

export const runNpm = ({ consumerRoot, cwd, args }) =>
  run({
    command: 'npm',
    args,
    cwd: cwd ?? consumerRoot,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  });
