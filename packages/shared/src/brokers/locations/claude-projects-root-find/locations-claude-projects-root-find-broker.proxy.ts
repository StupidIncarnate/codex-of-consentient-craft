import { osUserHomedirAdapterProxy } from '../../../adapters/os/user-homedir/os-user-homedir-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsClaudeProjectsRootFindBrokerProxy = (): {
  setupProjectsRoot: (params: { homeDir: FilePath; projectsRoot: FilePath }) => void;
} => {
  const homedirProxy = osUserHomedirAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupProjectsRoot: ({
      homeDir,
      projectsRoot,
    }: {
      homeDir: FilePath;
      projectsRoot: FilePath;
    }): void => {
      homedirProxy.returns({ path: homeDir });
      pathJoinProxy.returns({ result: projectsRoot });
    },
  };
};
