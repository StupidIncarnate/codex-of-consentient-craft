import { spawn, type ChildProcess } from 'child_process';
import { PassThrough } from 'stream';
import { ExitCodeStub, type ExitCode } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { buildPreflightBrokerProxy } from '../preflight/build-preflight-broker.proxy';

// buildUntilGreenBroker calls buildPreflightBroker up to MAX_PASSES times with the SAME
// buildCommand, so every pass shares the identical `spawn` address and the shared
// buildPreflightBrokerProxy's sticky `calledWith` staging cannot tell one pass's outcome from the
// next's (the later registration would answer every pass). This proxy mocks `spawn` directly so
// `onceFor` can hand back a different outcome per pass, in FIFO order — same pattern as
// git-detect-default-branch-broker.proxy.ts.
//
// The child shape below mirrors childProcessSpawnStreamLinesAdapter's own contract: it reads
// stdout through `readline` and settles on the `close` event, so writing whole lines into a
// PassThrough and then firing the registered `close` listener is what makes both `onLine` and the
// accumulated `output` observable from a test.
type ErrorCallback = (error: Error) => void;
type CloseCallback = (code: number | null) => void;

const createBuildChild = ({
  exitCode,
  lines,
}: {
  exitCode: ExitCode;
  lines: readonly string[];
}): ChildProcess => {
  const stdout = new PassThrough();
  const stderr = new PassThrough();
  const listeners = {
    error: [] as ErrorCallback[],
    close: [] as CloseCallback[],
  };

  const child = {
    stdout,
    stderr,
    on: (event: string, callback: ErrorCallback | CloseCallback): unknown => {
      if (event === 'error') {
        listeners.error.push(callback as ErrorCallback);
      }
      if (event === 'close') {
        listeners.close.push(callback as CloseCallback);
      }
      return undefined;
    },
  } as unknown as ChildProcess;

  process.nextTick(() => {
    for (const line of lines) {
      stdout.write(`${line}\n`);
    }
    stdout.end();
    stderr.end();

    for (const cb of listeners.close) {
      cb(Number(exitCode));
    }
  });

  return child;
};

export const buildUntilGreenBrokerProxy = (): {
  setupBuildSuccess: (params: { command: string }) => void;
  setupBuildStdoutLines: (params: { command: string; lines: readonly string[] }) => void;
  setupBuildFailure: (params: { command: string; exitCode: ExitCode; output: string }) => void;
  setupFirstPassFailsSecondSucceeds: (params: {
    command: string;
    failOutput: string;
    successOutput: string;
  }) => void;
  getSpawnedArgs: (params: { command: string }) => unknown;
  getSpawnedArgsList: (params: { command: string }) => readonly unknown[];
} => {
  const handle = registerMock({ fn: spawn });
  // Created but unstaged to satisfy enforce-proxy-child-creation: this proxy answers `spawn`
  // directly (see the module comment above), so the shared proxy's own default never fires.
  buildPreflightBrokerProxy();

  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 2 });

  return {
    setupBuildSuccess: ({ command }: { command: string }): void => {
      handle
        .calledWith([command])
        .implement(() => createBuildChild({ exitCode: successCode, lines: ['Build succeeded'] }));
    },

    setupBuildStdoutLines: ({
      command,
      lines,
    }: {
      command: string;
      lines: readonly string[];
    }): void => {
      handle
        .calledWith([command])
        .implement(() => createBuildChild({ exitCode: successCode, lines }));
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
      handle
        .calledWith([command])
        .implement(() => createBuildChild({ exitCode, lines: output.split('\n') }));
    },

    setupFirstPassFailsSecondSucceeds: ({
      command,
      failOutput,
      successOutput,
    }: {
      command: string;
      failOutput: string;
      successOutput: string;
    }): void => {
      handle
        .onceFor([command])
        .implement(() => createBuildChild({ exitCode: failCode, lines: failOutput.split('\n') }));
      handle
        .onceFor([command])
        .implement(() =>
          createBuildChild({ exitCode: successCode, lines: successOutput.split('\n') }),
        );
    },

    getSpawnedArgs: ({ command }: { command: string }): unknown =>
      handle.callsMatching([command]).at(-1)?.[1],

    getSpawnedArgsList: ({ command }: { command: string }): readonly unknown[] =>
      handle.callsMatching([command]).map((call) => call[1]),
  };
};
