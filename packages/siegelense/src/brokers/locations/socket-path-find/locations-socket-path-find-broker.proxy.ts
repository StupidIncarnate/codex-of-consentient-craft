import { osTmpdirAdapterProxy } from '../../../adapters/os/tmpdir/os-tmpdir-adapter.proxy';
import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const locationsSocketPathFindBrokerProxy = (): {
  setupSocketPath: (params: { tmpDir: string; socketPath: FilePath }) => void;
} => {
  const tmpdirProxy = osTmpdirAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupSocketPath: ({ tmpDir, socketPath }: { tmpDir: string; socketPath: FilePath }): void => {
      tmpdirProxy.returns({ path: tmpDir });
      pathJoinProxy.returns({ result: socketPath });
    },
  };
};
