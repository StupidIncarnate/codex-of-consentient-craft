import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsNodeModulesPathFindBrokerProxy = (): {
  setupNodeModulesPath: (params: { nodeModulesPath: FilePath }) => void;
} => {
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupNodeModulesPath: ({ nodeModulesPath }: { nodeModulesPath: FilePath }): void => {
      pathJoinProxy.returns({ result: nodeModulesPath });
    },
  };
};
