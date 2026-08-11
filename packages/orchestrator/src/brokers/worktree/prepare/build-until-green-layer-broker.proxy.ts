import { spawn, type ChildProcess } from 'child_process';
import { EventEmitter, Readable } from 'stream';
import {
  ErrorMessageStub,
  ExitCodeStub,
  type ErrorMessage,
  type ExitCode,
} from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { buildPreflightBrokerProxy } from '../../build/preflight/build-preflight-broker.proxy';

// buildUntilGreenLayerBroker calls buildPreflightBroker up to MAX_PASSES times with the SAME
// buildCommand, so every pass shares the identical `spawn` address and the shared
// buildPreflightBrokerProxy's sticky `calledWith` staging cannot tell one pass's outcome from the
// next's (the later registration would answer every pass). This proxy mocks `spawn` directly so
// `onceFor` can hand back a different outcome per pass, in FIFO order — same pattern as
// git-detect-default-branch-broker.proxy.ts.
const createBuildChild = ({
  exitCode,
  output,
}: {
  exitCode: ExitCode;
  output: ErrorMessage;
}): ChildProcess => {
  const child = new EventEmitter() as ChildProcess;
  child.stdout = new Readable({
    read(): void {
      /* noop */
    },
  });
  child.stderr = new Readable({
    read(): void {
      /* noop */
    },
  });

  const mockStdout = child.stdout;
  const mockStderr = child.stderr;

  setImmediate(() => {
    if (String(output).length > 0) {
      mockStdout.push(Buffer.from(String(output)));
    }
    mockStdout.push(null);
    mockStderr.push(null);
    child.emit('exit', Number(exitCode), null);
  });

  return child;
};

export const buildUntilGreenLayerBrokerProxy = (): {
  setupBuildSuccess: (params: { command: string }) => void;
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
      handle.calledWith([command]).implement(() =>
        createBuildChild({
          exitCode: successCode,
          output: ErrorMessageStub({ value: 'Build succeeded' }),
        }),
      );
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
        .implement(() =>
          createBuildChild({ exitCode, output: ErrorMessageStub({ value: output }) }),
        );
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
        .implement(() =>
          createBuildChild({ exitCode: failCode, output: ErrorMessageStub({ value: failOutput }) }),
        );
      handle.onceFor([command]).implement(() =>
        createBuildChild({
          exitCode: successCode,
          output: ErrorMessageStub({ value: successOutput }),
        }),
      );
    },

    getSpawnedArgs: ({ command }: { command: string }): unknown =>
      handle.callsMatching([command]).at(-1)?.[1],

    getSpawnedArgsList: ({ command }: { command: string }): readonly unknown[] =>
      handle.callsMatching([command]).map((call) => call[1]),
  };
};
