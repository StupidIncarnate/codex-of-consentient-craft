import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsWorktreePathFindBrokerProxy = (): {
  setupWorktreePath: (params: { worktreePath: FilePath }) => void;
} => {
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupWorktreePath: ({ worktreePath }: { worktreePath: FilePath }): void => {
      pathJoinProxy.returns({ result: worktreePath });
    },
  };
};
