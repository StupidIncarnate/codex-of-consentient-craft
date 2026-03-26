import {
  childProcessSpawnCaptureAdapterProxy,
  fsExistsSyncAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { fsGlobSyncAdapterProxy } from '../../../adapters/fs/glob-sync/fs-glob-sync-adapter.proxy';
import { fsReadJsonSyncAdapterProxy } from '../../../adapters/fs/read-json-sync/fs-read-json-sync-adapter.proxy';
import { binResolveBrokerProxy } from '../../bin/resolve/bin-resolve-broker.proxy';

export const checkRunTypecheckBrokerProxy = (): {
  setupPass: (params?: { stdout?: string }) => void;
  setupFail: (params: { stdout: string }) => void;
  setupNoTsconfig: () => void;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  fsGlobSyncAdapterProxy();
  const jsonProxy = fsReadJsonSyncAdapterProxy();
  const binProxy = binResolveBrokerProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });

  return {
    setupPass: (params?: { stdout?: string }): void => {
      existsProxy.returns({ result: true });
      jsonProxy.returns({ content: '{"include":["src/**/*"]}' });
      binProxy.setupFound();
      captureProxy.setupSuccess({
        exitCode: successCode,
        stdout: params?.stdout ?? '',
        stderr: '',
      });
    },

    setupFail: ({ stdout }: { stdout: string }): void => {
      existsProxy.returns({ result: true });
      jsonProxy.returns({ content: '{"include":["src/**/*"]}' });
      binProxy.setupFound();
      captureProxy.setupSuccess({ exitCode: failCode, stdout, stderr: '' });
    },

    setupNoTsconfig: (): void => {
      existsProxy.returns({ result: false });
    },
  };
};
