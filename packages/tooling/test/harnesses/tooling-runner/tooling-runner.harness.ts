/**
 * PURPOSE: Provides execSync wrapper and path resolution for tooling CLI integration tests
 *
 * USAGE:
 * const tooling = toolingRunnerHarness();
 * const result = tooling.runStartup({ args: ['--pattern=**\/*.ts', '--cwd=/tmp/test'] });
 * expect(result.exitCode).toBe(0);
 */
import * as path from 'path';
import { execSync } from 'child_process';

import type { FilePath } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { CommandResultStub } from '../../../src/contracts/command-result/command-result.stub';
import { ExitCodeStub } from '../../../src/contracts/exit-code/exit-code.stub';
import { ProcessOutputStub } from '../../../src/contracts/process-output/process-output.stub';
import type { ExecErrorStub } from '../../../src/contracts/exec-error/exec-error.stub';

type ExecError = ReturnType<typeof ExecErrorStub>;

const ENTRY_PATH = FilePathStub({
  value: path.join(process.cwd(), 'bin', 'detect-duplicate-primitives.ts'),
});

const isExecError = (error: unknown): error is ExecError =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  typeof (error as Record<PropertyKey, unknown>).status === 'number';

export const toolingRunnerHarness = (): {
  runStartup: (params: { args: readonly string[] }) => ReturnType<typeof CommandResultStub>;
  entryPath: FilePath;
} => {
  const runStartup = ({
    args,
  }: {
    args: readonly string[];
  }): ReturnType<typeof CommandResultStub> => {
    const command = `npx tsx ${String(ENTRY_PATH)} ${args.join(' ')}`;

    try {
      const stdout = execSync(command, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd(),
      });
      return CommandResultStub({
        exitCode: ExitCodeStub({ value: 0 }),
        stdout: ProcessOutputStub({ value: stdout }),
        stderr: ProcessOutputStub({ value: '' }),
      });
    } catch (error) {
      if (!isExecError(error)) {
        throw error;
      }
      const execError = error;
      const DEFAULT_EXIT_CODE = 1;
      const exitCode = execError.status ?? DEFAULT_EXIT_CODE;
      const stdout = execError.stdout?.toString() ?? '';
      const stderr = execError.stderr?.toString() ?? '';
      return CommandResultStub({
        exitCode: ExitCodeStub({ value: exitCode }),
        stdout: ProcessOutputStub({ value: stdout }),
        stderr: ProcessOutputStub({ value: stderr }),
      });
    }
  };

  return {
    runStartup,
    entryPath: ENTRY_PATH,
  };
};
