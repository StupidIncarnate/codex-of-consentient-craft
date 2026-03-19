import {
  childProcessSpawnCaptureAdapterProxy,
  fsExistsSyncAdapterProxy,
  netFreePortAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { fsGlobSyncAdapterProxy } from '../../../adapters/fs/glob-sync/fs-glob-sync-adapter.proxy';
import { netKillPortAdapterProxy } from '../../../adapters/net/kill-port/net-kill-port-adapter.proxy';
import { binResolveBrokerProxy } from '../../bin/resolve/bin-resolve-broker.proxy';

export const checkRunE2eBrokerProxy = (): {
  setupPass: () => void;
  setupPassWithOutput: (params: { stdout: string }) => void;
  setupFail: (params: { stdout: string }) => void;
  setupFailWithBadOutput: () => void;
  setupFailWithInfraError: (params: { errorMessage: string }) => void;
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

  const queueFreePorts = (): void => {
    freePortProxy.setupPort({ port: 40_000 });
  };

  return {
    setupPass: (): void => {
      existsProxy.returns({ result: true });
      binProxy.setupFound();
      queueFreePorts();
      captureProxy.setupSuccess({
        exitCode: successCode,
        stdout: '{"suites":[],"errors":[]}',
        stderr: '',
      });
    },

    setupPassWithOutput: ({ stdout }: { stdout: string }): void => {
      existsProxy.returns({ result: true });
      binProxy.setupFound();
      queueFreePorts();
      captureProxy.setupSuccess({ exitCode: successCode, stdout, stderr: '' });
    },

    setupFail: ({ stdout }: { stdout: string }): void => {
      existsProxy.returns({ result: true });
      binProxy.setupFound();
      queueFreePorts();
      captureProxy.setupSuccess({ exitCode: failCode, stdout, stderr: '' });
    },

    setupFailWithBadOutput: (): void => {
      existsProxy.returns({ result: true });
      binProxy.setupFound();
      queueFreePorts();
      captureProxy.setupSuccess({
        exitCode: failCode,
        stdout: 'not valid json \x1b[31m',
        stderr: '',
      });
    },

    setupFailWithInfraError: ({ errorMessage }: { errorMessage: string }): void => {
      existsProxy.returns({ result: true });
      binProxy.setupFound();
      queueFreePorts();
      captureProxy.setupSuccess({
        exitCode: failCode,
        stdout: JSON.stringify({
          suites: [],
          errors: [{ message: errorMessage }],
        }),
        stderr: '',
      });
    },

    setupNoPlaywrightConfig: (): void => {
      existsProxy.returns({ result: false });
    },

    getSpawnedArgs: (): unknown => captureProxy.getSpawnedArgs(),
    getSpawnedOptions: (): unknown => captureProxy.getSpawnedOptions(),
  };
};
