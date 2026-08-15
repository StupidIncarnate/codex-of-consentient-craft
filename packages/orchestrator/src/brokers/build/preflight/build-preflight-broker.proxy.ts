import { ExitCodeStub, type ExitCode } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnStreamLinesAdapterProxy } from '@dungeonmaster/shared/testing';

export const buildPreflightBrokerProxy = (): {
  setupBuildSuccess: (params: { command: string }) => void;
  setupBuildStdoutLines: (params: { command: string; lines: readonly string[] }) => void;
  setupBuildFailure: (params: { command: string; exitCode: ExitCode; output: string }) => void;
  setupBuildError: (params: { command: string; error: Error }) => void;
  getSpawnedCommand: (params: { command: string }) => unknown;
  getSpawnedArgs: (params: { command: string }) => unknown;
} => {
  const streamProxy = childProcessSpawnStreamLinesAdapterProxy();

  return {
    setupBuildSuccess: ({ command }: { command: string }): void => {
      streamProxy.setupSuccess({
        command,
        exitCode: ExitCodeStub({ value: 0 }),
        stdoutLines: ['Build succeeded'],
      });
    },

    // The adapter joins stdout LINES with '\n' to build `output`, so a caller staging multi-line
    // output must hand the lines in rather than one pre-joined blob — that is also what the
    // streaming assertions read back through `onLine`.
    setupBuildStdoutLines: ({
      command,
      lines,
    }: {
      command: string;
      lines: readonly string[];
    }): void => {
      streamProxy.setupSuccess({
        command,
        exitCode: ExitCodeStub({ value: 0 }),
        stdoutLines: [...lines],
      });
    },

    setupBuildFailure: ({
      command,
      exitCode,
      output,
    }: {
      command: string;
      exitCode: ExitCode;
      output: string;
    }): void => {
      streamProxy.setupSuccess({ command, exitCode, stdoutLines: output.split('\n') });
    },

    setupBuildError: ({ command, error }: { command: string; error: Error }): void => {
      streamProxy.setupError({ command, error });
    },

    getSpawnedCommand: ({ command }: { command: string }): unknown =>
      streamProxy.getSpawnedCommand({ command }),

    getSpawnedArgs: ({ command }: { command: string }): unknown =>
      streamProxy.getSpawnedArgs({ command }),
  };
};
