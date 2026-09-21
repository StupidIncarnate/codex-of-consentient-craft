import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsPlannedWorkPathFindBrokerProxy = (): {
  setupPlannedWorkPath: (params: { plannedWorkPath: FilePath }) => void;
} => {
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupPlannedWorkPath: ({ plannedWorkPath }: { plannedWorkPath: FilePath }): void => {
      pathJoinProxy.returns({ result: plannedWorkPath });
    },
  };
};
