import {
  childProcessSpawnCaptureAdapterProxy,
  fsExistsSyncAdapterProxy,
  netFreePortAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { ErrorMessageStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { fsGlobSyncAdapterProxy } from '../../../adapters/fs/glob-sync/fs-glob-sync-adapter.proxy';
import { netKillPortAdapterProxy } from '../../../adapters/net/kill-port/net-kill-port-adapter.proxy';
import { binResolveBrokerProxy } from '../../bin/resolve/bin-resolve-broker.proxy';

export const checkRunE2eBrokerProxy = (): {
  setupPass: () => void;
  setupPassWithOutput: (params: { stdout: string }) => void;
  setupFail: (params: { stdout: string }) => void;
  setupFailWithEmptyOutput: () => void;
  setupNoPlaywrightConfig: () => void;
  getSpawnedArgs: () => unknown;
  getSpawnedOptions: () => unknown;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const freePortProxy = netFreePortAdapterProxy();
  fsGlobSyncAdapterProxy();
  netKillPortAdapterProxy();
  const binProxy = binResolveBrokerProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });
  const emptyMessage = ErrorMessageStub({ value: '' });

  const queueFreePorts = (): void => {
    freePortProxy.setupPort({ port: 40_000 });
  };

  const setupPlaywrightConfigExists = (): void => {
    existsProxy.returns({ result: true });
  };

  return {
    setupPass: (): void => {
      setupPlaywrightConfigExists();
      binProxy.setupFound();
      queueFreePorts();
      captureProxy.setupSuccess({
        exitCode: successCode,
        stdout: emptyMessage,
        stderr: emptyMessage,
      });
    },

    setupPassWithOutput: ({ stdout }: { stdout: string }): void => {
      setupPlaywrightConfigExists();
      binProxy.setupFound();
      queueFreePorts();
      captureProxy.setupSuccess({
        exitCode: successCode,
        stdout: ErrorMessageStub({ value: stdout }),
        stderr: emptyMessage,
      });
    },

    setupFail: ({ stdout }: { stdout: string }): void => {
      setupPlaywrightConfigExists();
      binProxy.setupFound();
      queueFreePorts();
      captureProxy.setupSuccess({
        exitCode: failCode,
        stdout: ErrorMessageStub({ value: stdout }),
        stderr: emptyMessage,
      });
    },

    setupFailWithEmptyOutput: (): void => {
      setupPlaywrightConfigExists();
      binProxy.setupFound();
      queueFreePorts();
      captureProxy.setupSuccess({
        exitCode: failCode,
        stdout: emptyMessage,
        stderr: emptyMessage,
      });
    },

    setupNoPlaywrightConfig: (): void => {
      existsProxy.returns({ result: false });
    },

    getSpawnedArgs: (): unknown => captureProxy.getSpawnedArgs(),
    getSpawnedOptions: (): unknown => captureProxy.getSpawnedOptions(),
  };
};
