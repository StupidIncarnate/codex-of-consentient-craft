import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import { ExitCodeStub } from '@dungeonmaster/shared/contracts';
import { globResolveBrokerProxy } from '../../glob/resolve/glob-resolve-broker.proxy';

export const checkRunTypecheckBrokerProxy = (): {
  setupPass: () => void;
  setupFail: (params: { stdout: string }) => void;
  setupGlobTs: (params: { output: string }) => void;
  setupGlobTsx: (params: { output: string }) => void;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  globResolveBrokerProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });

  return {
    setupPass: (): void => {
      captureProxy.setupSuccess({ exitCode: successCode, stdout: '', stderr: '' });
    },

    setupFail: ({ stdout }: { stdout: string }): void => {
      captureProxy.setupSuccess({ exitCode: failCode, stdout, stderr: '' });
    },

    setupGlobTs: ({ output }: { output: string }): void => {
      captureProxy.setupSuccess({ exitCode: successCode, stdout: output, stderr: '' });
    },

    setupGlobTsx: ({ output }: { output: string }): void => {
      captureProxy.setupSuccess({ exitCode: successCode, stdout: output, stderr: '' });
    },
  };
};
