import {
  dungeonmasterHomeFindBrokerProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const locationsRootPathFindBrokerProxy = (): {
  setupRootPath: (params: { homeDir: string; homePath: FilePath; rootPath: FilePath }) => void;
  // Stages ONLY the addressed homedir()/join() pair dungeonmasterHomeFindBroker reads — never the
  // outer root join. A caller composed alongside another resolver that ALSO makes real path.join
  // calls (instanceKillBrokerProxy's convention) needs this instead of setupRootPath: the outer
  // join then falls through to pathJoinAdapterProxy's own sticky real-passthrough default, which
  // computes the identical literal once the home resolves correctly — order-independent, unlike
  // setupRootPath's one-shot `pathJoinProxy.returns()`.
  setupHomeOnly: (params: { homeDir: string; homePath: FilePath }) => void;
} => {
  const dmHomeProxy = dungeonmasterHomeFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupRootPath: ({
      homeDir,
      homePath,
      rootPath,
    }: {
      homeDir: string;
      homePath: FilePath;
      rootPath: FilePath;
    }): void => {
      dmHomeProxy.clearHomeEnv();
      dmHomeProxy.setupHomePath({ homeDir, homePath });
      pathJoinProxy.returns({ result: rootPath });
    },

    setupHomeOnly: ({ homeDir, homePath }: { homeDir: string; homePath: FilePath }): void => {
      dmHomeProxy.setupHomePath({ homeDir, homePath });
    },
  };
};
