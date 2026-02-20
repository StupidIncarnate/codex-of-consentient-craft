import {
  childProcessSpawnCaptureAdapterProxy,
  fsExistsSyncAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { ExitCodeStub } from '@dungeonmaster/shared/contracts';

export const checkRunE2eBrokerProxy = (): {
  setupPass: () => void;
  setupPassWithOutput: (params: { stdout: string }) => void;
  setupFail: (params: { stdout: string }) => void;
  setupFailWithBadOutput: () => void;
  setupNoPlaywrightConfig: () => void;
  getSpawnedArgs: () => unknown;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });

  return {
    setupPass: (): void => {
      existsProxy.returns({ result: true });
      captureProxy.setupSuccess({
        exitCode: successCode,
        stdout: '{"suites":[],"errors":[]}',
        stderr: '',
      });
    },

    setupPassWithOutput: ({ stdout }: { stdout: string }): void => {
      existsProxy.returns({ result: true });
      captureProxy.setupSuccess({ exitCode: successCode, stdout, stderr: '' });
    },

    setupFail: ({ stdout }: { stdout: string }): void => {
      existsProxy.returns({ result: true });
      captureProxy.setupSuccess({ exitCode: failCode, stdout, stderr: '' });
    },

    setupFailWithBadOutput: (): void => {
      existsProxy.returns({ result: true });
      captureProxy.setupSuccess({
        exitCode: failCode,
        stdout: 'not valid json \x1b[31m',
        stderr: '',
      });
    },

    setupNoPlaywrightConfig: (): void => {
      existsProxy.returns({ result: false });
    },

    getSpawnedArgs: (): unknown => captureProxy.getSpawnedArgs(),
  };
};
