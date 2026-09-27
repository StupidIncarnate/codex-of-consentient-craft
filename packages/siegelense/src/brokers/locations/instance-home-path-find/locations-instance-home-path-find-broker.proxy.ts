import { join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

import { osTmpdirAdapterProxy } from '../../../adapters/os/tmpdir/os-tmpdir-adapter.proxy';

export const locationsInstanceHomePathFindBrokerProxy = (): {
  setupHomePath: (params: { tmpDir: string; homePath: FilePath }) => void;
} => {
  const tmpdirProxy = osTmpdirAdapterProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports.
  const joinHandle = registerMock({ fn: join });

  return {
    // This method's own callers never carry `instanceId` (only tmpDir/homePath), so the broker's
    // own second join segment (`${driverStatics.boot.homePrefix}${instanceId}`) is recovered here
    // by slicing tmpDir's own known length off homePath — the same technique
    // locationsQuestFolderPathFindBrokerProxy (shared) uses to recover `questId`.
    setupHomePath: ({ tmpDir, homePath }: { tmpDir: string; homePath: FilePath }): void => {
      tmpdirProxy.returns({ path: tmpDir });
      const suffix = homePath.slice(tmpDir.length + 1);
      joinHandle.calledWith([tmpDir, suffix]).returns(homePath);
    },
  };
};
