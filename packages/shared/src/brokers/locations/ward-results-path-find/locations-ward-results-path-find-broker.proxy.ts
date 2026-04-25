import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsWardResultsPathFindBrokerProxy = (): {
  setupWardResultsPath: (params: { wardResultsPath: FilePath }) => void;
} => {
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupWardResultsPath: ({ wardResultsPath }: { wardResultsPath: FilePath }): void => {
      pathJoinProxy.returns({ result: wardResultsPath });
    },
  };
};
