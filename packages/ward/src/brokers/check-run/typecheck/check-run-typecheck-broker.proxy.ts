import {
  childProcessSpawnCaptureAdapterProxy,
  fsExistsSyncAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { binResolveBrokerProxy } from '../../bin/resolve/bin-resolve-broker.proxy';

export const checkRunTypecheckBrokerProxy = (): {
  setupPass: (params?: { stdout?: string }) => void;
  setupFail: (params: { stdout: string }) => void;
  setupNoTsconfig: () => void;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const binProxy = binResolveBrokerProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });

  return {
    setupPass: (params?: { stdout?: string }): void => {
      existsProxy.returns({ result: true });
      binProxy.setupFound();
      captureProxy.setupSuccess({
        exitCode: successCode,
        stdout: params?.stdout ?? '',
        stderr: '',
      });
    },

    setupFail: ({ stdout }: { stdout: string }): void => {
      existsProxy.returns({ result: true });
      binProxy.setupFound();
      captureProxy.setupSuccess({ exitCode: failCode, stdout, stderr: '' });
    },

    setupNoTsconfig: (): void => {
      existsProxy.returns({ result: false });
    },
  };
};
