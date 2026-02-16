import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import { ExitCodeStub } from '@dungeonmaster/shared/contracts';

export const checkRunE2eBrokerProxy = (): {
  setupPass: () => void;
  setupFail: (params: { stdout: string }) => void;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });

  return {
    setupPass: (): void => {
      captureProxy.setupSuccess({ exitCode: successCode, stdout: '{"suites":[]}', stderr: '' });
    },

    setupFail: ({ stdout }: { stdout: string }): void => {
      captureProxy.setupSuccess({ exitCode: failCode, stdout, stderr: '' });
    },
  };
};
