import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import { ExitCodeStub } from '@dungeonmaster/shared/contracts';

export const checkRunUnitBrokerProxy = (): {
  setupPass: () => void;
  setupPassWithOutput: (params: { stdout: string }) => void;
  setupFail: (params: { stdout: string }) => void;
  setupFailWithBadOutput: () => void;
  setupPassWithStderr: (params: { stdout: string; stderr: string }) => void;
  setupFailWithStderr: (params: { stdout: string; stderr: string }) => void;
  getSpawnedArgs: () => unknown;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });

  return {
    setupPass: (): void => {
      captureProxy.setupSuccess({
        exitCode: successCode,
        stdout: '{"testResults":[],"numTotalTestSuites":0,"success":true}',
        stderr: '',
      });
    },

    setupPassWithOutput: ({ stdout }: { stdout: string }): void => {
      captureProxy.setupSuccess({ exitCode: successCode, stdout, stderr: '' });
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

    setupPassWithStderr: ({ stdout, stderr }: { stdout: string; stderr: string }): void => {
      captureProxy.setupSuccess({ exitCode: successCode, stdout, stderr });
    },

    setupFailWithStderr: ({ stdout, stderr }: { stdout: string; stderr: string }): void => {
      captureProxy.setupSuccess({ exitCode: failCode, stdout, stderr });
    },

    getSpawnedArgs: (): unknown => captureProxy.getSpawnedArgs(),
  };
};
