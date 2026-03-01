import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import { ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { fsGlobSyncAdapterProxy } from '../../../adapters/fs/glob-sync/fs-glob-sync-adapter.proxy';
import { binResolveBrokerProxy } from '../../bin/resolve/bin-resolve-broker.proxy';

export const checkRunIntegrationBrokerProxy = (): {
  setupPass: () => void;
  setupPassWithOutput: (params: { stdout: string }) => void;
  setupFail: (params: { stdout: string }) => void;
  setupFailWithBadOutput: () => void;
  setupPassWithStderr: (params: { stdout: string; stderr: string }) => void;
  setupFailWithStderr: (params: { stdout: string; stderr: string }) => void;
  setupNoTestFiles: () => void;
  getSpawnedArgs: () => unknown;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const globProxy = fsGlobSyncAdapterProxy();
  const binProxy = binResolveBrokerProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });

  return {
    setupPass: (): void => {
      binProxy.setupFound();
      captureProxy.setupSuccess({
        exitCode: successCode,
        stdout: '{"testResults":[],"numTotalTestSuites":0,"success":true}',
        stderr: '',
      });
    },

    setupPassWithOutput: ({ stdout }: { stdout: string }): void => {
      binProxy.setupFound();
      captureProxy.setupSuccess({ exitCode: successCode, stdout, stderr: '' });
    },

    setupFail: ({ stdout }: { stdout: string }): void => {
      binProxy.setupFound();
      captureProxy.setupSuccess({ exitCode: failCode, stdout, stderr: '' });
    },

    setupFailWithBadOutput: (): void => {
      binProxy.setupFound();
      captureProxy.setupSuccess({
        exitCode: failCode,
        stdout: 'not valid json \x1b[31m',
        stderr: '',
      });
    },

    setupPassWithStderr: ({ stdout, stderr }: { stdout: string; stderr: string }): void => {
      binProxy.setupFound();
      captureProxy.setupSuccess({ exitCode: successCode, stdout, stderr });
    },

    setupFailWithStderr: ({ stdout, stderr }: { stdout: string; stderr: string }): void => {
      binProxy.setupFound();
      captureProxy.setupSuccess({ exitCode: failCode, stdout, stderr });
    },

    setupNoTestFiles: (): void => {
      globProxy.returnsEmpty();
    },

    getSpawnedArgs: (): unknown => captureProxy.getSpawnedArgs(),
  };
};
