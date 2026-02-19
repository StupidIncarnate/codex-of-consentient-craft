import {
  childProcessSpawnCaptureAdapterProxy,
  fsExistsSyncAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { ExitCodeStub } from '@dungeonmaster/shared/contracts';

export const checkRunTypecheckBrokerProxy = (): {
  setupPass: (params?: { stdout?: string }) => void;
  setupFail: (params: { stdout: string }) => void;
  setupNoTsconfig: () => void;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });

  return {
    setupPass: (params?: { stdout?: string }): void => {
      existsProxy.returns({ result: true });
      captureProxy.setupSuccess({
        exitCode: successCode,
        stdout: params?.stdout ?? '',
        stderr: '',
      });
    },

    setupFail: ({ stdout }: { stdout: string }): void => {
      existsProxy.returns({ result: true });
      captureProxy.setupSuccess({ exitCode: failCode, stdout, stderr: '' });
    },

    setupNoTsconfig: (): void => {
      existsProxy.returns({ result: false });
    },
  };
};
