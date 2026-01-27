import { exec } from 'child_process';

import type { ExitCode } from '@dungeonmaster/shared/contracts';

import type { ExecResult } from '../../../contracts/exec-result/exec-result-contract';
import type { ExecResultStub } from '../../../contracts/exec-result/exec-result.stub';
import type { Stderr } from '../../../contracts/stderr/stderr-contract';
import { StderrStub } from '../../../contracts/stderr/stderr.stub';
import type { Stdout } from '../../../contracts/stdout/stdout-contract';
import { StdoutStub } from '../../../contracts/stdout/stdout.stub';

jest.mock('child_process');

type ExecResultType = ReturnType<typeof ExecResultStub>;

type ExecError = Error & {
  code: ExitCode;
};

type ExecCallback = (error: ExecError | null, stdout: Stdout, stderr: Stderr) => void;

export const childProcessExecAdapterProxy = (): {
  resolves: ({ result }: { result: ExecResultType }) => void;
  rejects: ({ error }: { error: Error }) => void;
} => {
  const mockExec = jest.mocked(exec);

  const emptyStdout = StdoutStub({ value: '' });
  const emptyStderr = StderrStub({ value: '' });

  // Default mock implementation - success with empty output
  mockExec.mockImplementation(
    (_cmd: Parameters<typeof exec>[0], _opts: Parameters<typeof exec>[1], cb?: ExecCallback) => {
      const callback = typeof _opts === 'function' ? (_opts as ExecCallback) : cb;
      if (callback) {
        process.nextTick(() => {
          callback(null, emptyStdout, emptyStderr);
        });
      }
      return undefined as never;
    },
  );

  return {
    resolves: ({ result }: { result: ExecResult }): void => {
      mockExec.mockImplementationOnce(
        (
          _cmd: Parameters<typeof exec>[0],
          _opts: Parameters<typeof exec>[1],
          cb?: ExecCallback,
        ) => {
          const callback = typeof _opts === 'function' ? (_opts as ExecCallback) : cb;
          if (callback) {
            process.nextTick(() => {
              if (result.exitCode === 0) {
                callback(null, result.stdout, result.stderr);
              } else {
                const error = new Error('Command failed') as ExecError;
                error.code = result.exitCode;
                callback(error, result.stdout, result.stderr);
              }
            });
          }
          return undefined as never;
        },
      );
    },
    rejects: ({ error }: { error: Error }): void => {
      mockExec.mockImplementationOnce(
        (
          _cmd: Parameters<typeof exec>[0],
          _opts: Parameters<typeof exec>[1],
          cb?: ExecCallback,
        ) => {
          const callback = typeof _opts === 'function' ? (_opts as ExecCallback) : cb;
          if (callback) {
            process.nextTick(() => {
              callback(error as ExecError, emptyStdout, emptyStderr);
            });
          }
          return undefined as never;
        },
      );
    },
  };
};
