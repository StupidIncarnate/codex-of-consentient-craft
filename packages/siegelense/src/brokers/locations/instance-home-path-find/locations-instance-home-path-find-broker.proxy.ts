import { osTmpdirAdapterProxy } from '../../../adapters/os/tmpdir/os-tmpdir-adapter.proxy';
import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const locationsInstanceHomePathFindBrokerProxy = (): {
  setupHomePath: (params: { tmpDir: string; homePath: FilePath }) => void;
} => {
  const tmpdirProxy = osTmpdirAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupHomePath: ({ tmpDir, homePath }: { tmpDir: string; homePath: FilePath }): void => {
      tmpdirProxy.returns({ path: tmpDir });
      pathJoinProxy.returns({ result: homePath });
    },
  };
};
