import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import { ErrorMessageStub, ExitCodeStub } from '@dungeonmaster/shared/contracts';

import { binResolveBrokerProxy } from '../../bin/resolve/bin-resolve-broker.proxy';
import { fsGlobSyncAdapterProxy } from '../../../adapters/fs/glob-sync/fs-glob-sync-adapter.proxy';
import { fsReadJsonSyncAdapterProxy } from '../../../adapters/fs/read-json-sync/fs-read-json-sync-adapter.proxy';

export const checkRunTypecheckRefsBrokerProxy = (): {
  setupTscBOutput: (params: { output: string; exitCode?: number }) => void;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const binProxy = binResolveBrokerProxy();
  fsGlobSyncAdapterProxy();
  const jsonProxy = fsReadJsonSyncAdapterProxy();
  const emptyMessage = ErrorMessageStub({ value: '' });

  binProxy.setupFound();
  jsonProxy.returns({ content: '{"include":["src/**/*"]}' });

  return {
    setupTscBOutput: ({ output, exitCode = 0 }: { output: string; exitCode?: number }): void => {
      captureProxy.setupSuccess({
        exitCode: ExitCodeStub({ value: exitCode }),
        stdout: ErrorMessageStub({ value: output }),
        stderr: emptyMessage,
      });
    },
  };
};
