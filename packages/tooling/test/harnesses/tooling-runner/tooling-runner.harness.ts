/**
 * PURPOSE: Provides execSync wrapper and path resolution for tooling CLI integration tests
 *
 * USAGE:
 * const tooling = toolingRunnerHarness();
 * const result = tooling.runStartup({ args: ['--pattern=**\/*.ts', '--cwd=/tmp/test'] });
 * expect(result.exitCode).toBe(0);
 */
import * as path from '#gateway/node/path';
import { execSync } from '#gateway/node/child_process';

import type { FilePath } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';

import { cwd } from '#gateway/node/process';

interface RunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

interface ExecError {
  status: number;
  stdout?: { toString: () => string };
  stderr?: { toString: () => string };
}

// Runs the source entry under plain tsx — no `--conditions=source`, matching this package's own
// "detect-duplicates" npm script (package.json: `tsx src/index.ts`). That script's own target,
// src/index.ts, is a re-export barrel with no top-level call (confirmed: running it does
// nothing), so this points at the actual CLI entry point instead — the same file the built
// `dist/bin/detect-duplicate-primitives.js` this replaced was compiled from.
const ENTRY_PATH = FilePathStub({
  value: path.join(cwd(), 'bin', 'detect-duplicate-primitives.ts'),
});

const isExecError = (error: unknown): error is ExecError =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  typeof (error as Record<PropertyKey, unknown>).status === 'number';

export const toolingRunnerHarness = (): {
  runStartup: (params: { args: readonly string[] }) => RunResult;
  entryPath: FilePath;
} => {
  const runStartup = ({ args }: { args: readonly string[] }): RunResult => {
    const command = `npx tsx ${String(ENTRY_PATH)} ${args.join(' ')}`;

    try {
      const stdout = execSync(command, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: cwd(),
      });
      return { exitCode: 0, stdout, stderr: '' };
    } catch (error) {
      if (!isExecError(error)) {
        throw error;
      }
      return {
        exitCode: error.status,
        stdout: error.stdout?.toString() ?? '',
        stderr: error.stderr?.toString() ?? '',
      };
    }
  };

  return {
    runStartup,
    entryPath: ENTRY_PATH,
  };
};
