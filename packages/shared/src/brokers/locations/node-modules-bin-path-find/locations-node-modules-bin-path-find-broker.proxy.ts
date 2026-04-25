import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsNodeModulesBinPathFindBrokerProxy = (): {
  setupBinPath: (params: { binPath: FilePath }) => void;
} => {
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupBinPath: ({ binPath }: { binPath: FilePath }): void => {
      pathJoinProxy.returns({ result: binPath });
    },
  };
};
