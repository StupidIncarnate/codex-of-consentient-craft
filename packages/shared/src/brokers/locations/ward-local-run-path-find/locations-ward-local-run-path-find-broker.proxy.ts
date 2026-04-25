import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsWardLocalRunPathFindBrokerProxy = (): {
  setupWardLocalRunPath: (params: { runPath: FilePath }) => void;
} => {
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupWardLocalRunPath: ({ runPath }: { runPath: FilePath }): void => {
      pathJoinProxy.returns({ result: runPath });
    },
  };
};
