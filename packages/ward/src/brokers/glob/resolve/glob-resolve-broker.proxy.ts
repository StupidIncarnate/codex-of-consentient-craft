import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import { ExitCodeStub } from '@dungeonmaster/shared/contracts';

export const globResolveBrokerProxy = (): {
  setupMatches: (params: { output: string }) => void;
  setupNoMatches: () => void;
  setupFails: () => void;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });

  return {
    setupMatches: ({ output }: { output: string }): void => {
      captureProxy.setupSuccess({ exitCode: successCode, stdout: output, stderr: '' });
    },

    setupNoMatches: (): void => {
      captureProxy.setupSuccess({ exitCode: successCode, stdout: '', stderr: '' });
    },

    setupFails: (): void => {
      captureProxy.setupSuccess({ exitCode: failCode, stdout: '', stderr: 'fatal' });
    },
  };
};
