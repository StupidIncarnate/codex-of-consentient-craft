import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import { ExitCodeStub } from '@dungeonmaster/shared/contracts';

export const checkRunTestBrokerProxy = (): {
  setupPass: () => void;
  setupFail: (params: { stdout: string }) => void;
  setupFailWithBadOutput: () => void;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });

  return {
    setupPass: (): void => {
      captureProxy.setupSuccess({
        exitCode: successCode,
        stdout: '{"testResults":[],"success":true}',
        stderr: '',
      });
    },

    setupFail: ({ stdout }: { stdout: string }): void => {
      captureProxy.setupSuccess({ exitCode: failCode, stdout, stderr: '' });
    },

    setupFailWithBadOutput: (): void => {
      captureProxy.setupSuccess({
        exitCode: failCode,
        stdout: 'not valid json \x1b[31m',
        stderr: '',
      });
    },
  };
};
