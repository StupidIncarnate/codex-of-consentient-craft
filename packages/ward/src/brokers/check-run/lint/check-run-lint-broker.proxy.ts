import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import { ErrorMessageStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { binResolveBrokerProxy } from '../../bin/resolve/bin-resolve-broker.proxy';

export const checkRunLintBrokerProxy = (): {
  setupPass: () => void;
  setupPassWithOutput: (params: { stdout: string }) => void;
  setupFail: (params: { stdout: string }) => void;
  setupPassWithStderr: (params: { stdout: string; stderr: string }) => void;
  setupNonJsonFailure: (params: { stdout: string }) => void;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const binProxy = binResolveBrokerProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });
  const emptyMessage = ErrorMessageStub({ value: '' });

  return {
    setupPass: (): void => {
      binProxy.setupFound();
      captureProxy.setupSuccess({
        exitCode: successCode,
        stdout: ErrorMessageStub({ value: '[]' }),
        stderr: emptyMessage,
      });
    },

    setupPassWithOutput: ({ stdout }: { stdout: string }): void => {
      binProxy.setupFound();
      captureProxy.setupSuccess({
        exitCode: successCode,
        stdout: ErrorMessageStub({ value: stdout }),
        stderr: emptyMessage,
      });
    },

    setupFail: ({ stdout }: { stdout: string }): void => {
      binProxy.setupFound();
      captureProxy.setupSuccess({
        exitCode: failCode,
        stdout: ErrorMessageStub({ value: stdout }),
        stderr: emptyMessage,
      });
    },

    setupPassWithStderr: ({ stdout, stderr }: { stdout: string; stderr: string }): void => {
      binProxy.setupFound();
      captureProxy.setupSuccess({
        exitCode: successCode,
        stdout: ErrorMessageStub({ value: stdout }),
        stderr: ErrorMessageStub({ value: stderr }),
      });
    },

    setupNonJsonFailure: ({ stdout }: { stdout: string }): void => {
      binProxy.setupFound();
      captureProxy.setupSuccess({
        exitCode: failCode,
        stdout: ErrorMessageStub({ value: stdout }),
        stderr: emptyMessage,
      });
    },
  };
};
