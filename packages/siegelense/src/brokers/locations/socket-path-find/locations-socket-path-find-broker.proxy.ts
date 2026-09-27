import { join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import type { FilePath } from '@dungeonmaster/shared/contracts';

import { osTmpdirAdapterProxy } from '../../../adapters/os/tmpdir/os-tmpdir-adapter.proxy';

export const locationsSocketPathFindBrokerProxy = (): {
  setupSocketPath: (params: { tmpDir: string; socketPath: FilePath }) => void;
} => {
  const tmpdirProxy = osTmpdirAdapterProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports. Sticky real-passthrough default: instanceId is often chosen by
  // a caller AFTER a parent proxy's own constructor already ran (siegelenseDriverResponderProxy's
  // convention), so no exact tuple can be staged ahead of time in that case — the real, pure join
  // computation is always the honest answer regardless of which instanceId shows up later. A live
  // `setupSocketPath` call below stages a MORE specific tuple, which still outranks this default.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  const joinHandle = registerMock({ fn: join });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));

  return {
    // This method's own callers never carry the instanceId+extension segment (only the FINAL
    // socketPath), so it is recovered here by slicing tmpDir + socketsDirName's own known length
    // off socketPath — the same technique locationsProfilesPathFindBrokerProxy (shared) uses to
    // recover `specHash`.
    setupSocketPath: ({ tmpDir, socketPath }: { tmpDir: string; socketPath: FilePath }): void => {
      tmpdirProxy.returns({ path: tmpDir });
      const prefixLength =
        tmpDir.length + 1 + locationsStatics.siegelense.socketsDirName.length + 1;
      const instanceIdWithExt = socketPath.slice(prefixLength);
      joinHandle
        .calledWith([tmpDir, locationsStatics.siegelense.socketsDirName, instanceIdWithExt])
        .returns(socketPath);
    },
  };
};
