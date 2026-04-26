import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsDesignScaffoldPathFindBrokerProxy = (): {
  setupDesignScaffoldPath: (params: { designPath: FilePath }) => void;
} => {
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupDesignScaffoldPath: ({ designPath }: { designPath: FilePath }): void => {
      pathJoinProxy.returns({ result: designPath });
    },
  };
};
