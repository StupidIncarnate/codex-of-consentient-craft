import {
  childProcessSpawnCaptureAdapterProxy,
  fsExistsSyncAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { ErrorMessageStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

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
  setDiscoveredFiles: (params: { files: string[] }) => void;
  getSpawnedArgs: () => unknown;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const globProxy = fsGlobSyncAdapterProxy();
  const binProxy = binResolveBrokerProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });
  const emptyMessage = ErrorMessageStub({ value: '' });

  return {
    setupPass: (): void => {
      existsProxy.returns({ result: true });
      binProxy.setupFound();
      captureProxy.setupSuccess({
        exitCode: successCode,
        stdout: ErrorMessageStub({
          value: '{"testResults":[],"numTotalTestSuites":0,"success":true}',
        }),
        stderr: emptyMessage,
      });
    },

    setupPassWithOutput: ({ stdout }: { stdout: string }): void => {
      existsProxy.returns({ result: true });
      binProxy.setupFound();
      captureProxy.setupSuccess({
        exitCode: successCode,
        stdout: ErrorMessageStub({ value: stdout }),
        stderr: emptyMessage,
      });
    },

    setupFail: ({ stdout }: { stdout: string }): void => {
      existsProxy.returns({ result: true });
      binProxy.setupFound();
      captureProxy.setupSuccess({
        exitCode: failCode,
        stdout: ErrorMessageStub({ value: stdout }),
        stderr: emptyMessage,
      });
    },

    setupFailWithBadOutput: (): void => {
      existsProxy.returns({ result: true });
      binProxy.setupFound();
      captureProxy.setupSuccess({
        exitCode: failCode,
        stdout: ErrorMessageStub({ value: 'not valid json \x1b[31m' }),
        stderr: emptyMessage,
      });
    },

    setupPassWithStderr: ({ stdout, stderr }: { stdout: string; stderr: string }): void => {
      existsProxy.returns({ result: true });
      binProxy.setupFound();
      captureProxy.setupSuccess({
        exitCode: successCode,
        stdout: ErrorMessageStub({ value: stdout }),
        stderr: ErrorMessageStub({ value: stderr }),
      });
    },

    setupFailWithStderr: ({ stdout, stderr }: { stdout: string; stderr: string }): void => {
      existsProxy.returns({ result: true });
      binProxy.setupFound();
      captureProxy.setupSuccess({
        exitCode: failCode,
        stdout: ErrorMessageStub({ value: stdout }),
        stderr: ErrorMessageStub({ value: stderr }),
      });
    },

    setupNoTestFiles: (): void => {
      existsProxy.returns({ result: true });
      globProxy.returnsEmpty();
    },

    setDiscoveredFiles: ({ files }: { files: string[] }): void => {
      existsProxy.returns({ result: true });
      globProxy.returnsFiles({ files });
    },

    getSpawnedArgs: (): unknown => captureProxy.getSpawnedArgs(),
  };
};
