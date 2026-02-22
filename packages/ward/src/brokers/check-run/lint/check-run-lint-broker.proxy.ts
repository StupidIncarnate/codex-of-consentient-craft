import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import { ExitCodeStub } from '@dungeonmaster/shared/contracts';

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

  return {
    setupPass: (): void => {
      binProxy.setupFound();
      captureProxy.setupSuccess({ exitCode: successCode, stdout: '[]', stderr: '' });
    },

    setupPassWithOutput: ({ stdout }: { stdout: string }): void => {
      binProxy.setupFound();
      captureProxy.setupSuccess({ exitCode: successCode, stdout, stderr: '' });
    },

    setupFail: ({ stdout }: { stdout: string }): void => {
      binProxy.setupFound();
      captureProxy.setupSuccess({ exitCode: failCode, stdout, stderr: '' });
    },

    setupPassWithStderr: ({ stdout, stderr }: { stdout: string; stderr: string }): void => {
      binProxy.setupFound();
      captureProxy.setupSuccess({ exitCode: successCode, stdout, stderr });
    },

    setupNonJsonFailure: ({ stdout }: { stdout: string }): void => {
      binProxy.setupFound();
      captureProxy.setupSuccess({ exitCode: failCode, stdout, stderr: '' });
    },
  };
};
