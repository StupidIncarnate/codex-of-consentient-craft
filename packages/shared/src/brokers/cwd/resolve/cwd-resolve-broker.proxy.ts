import { configRootFindBrokerProxy } from '../../config-root/find/config-root-find-broker.proxy';
import { projectRootFindBrokerProxy } from '../../project-root/find/project-root-find-broker.proxy';
import { dungeonmasterHomeFindBrokerProxy } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker.proxy';
import { guildPathWalkUpLayerBrokerProxy } from './guild-path-walk-up-layer-broker.proxy';

export const cwdResolveBrokerProxy = (): {
  setupRepoRootFoundAtStart: (params: { startPath: string }) => void;
  setupRepoRootFoundInParent: (params: { startPath: string; repoRoot: string }) => void;
  setupProjectRootFoundAtStart: (params: { startPath: string }) => void;
  setupProjectRootFoundInParent: (params: {
    startPath: string;
    parentPath: string;
    projectRoot: string;
  }) => void;
  setupGuildPathFoundAtStart: (params: { startPath: string }) => void;
  setupGuildPathFoundInParent: (params: { startPath: string; guildPath: string }) => void;
  setupGuildPathNotFound: (params: { startPath: string }) => void;
  setupDungeonmasterHomeFromHomedir: (params: { homeDir: string; homePath: string }) => void;
  setupDungeonmasterHomeFromEnv: (params: { homePath: string }) => void;
  clearDungeonmasterHomeEnv: () => void;
} => {
  const configRootProxy = configRootFindBrokerProxy();
  const projectRootProxy = projectRootFindBrokerProxy();
  const guildWalkProxy = guildPathWalkUpLayerBrokerProxy();
  const dungeonmasterHomeProxy = dungeonmasterHomeFindBrokerProxy();

  return {
    setupRepoRootFoundAtStart: ({ startPath }: { startPath: string }): void => {
      configRootProxy.setupConfigRootFound({ startPath, configRootPath: startPath });
    },

    setupRepoRootFoundInParent: ({
      startPath,
      repoRoot,
    }: {
      startPath: string;
      repoRoot: string;
    }): void => {
      configRootProxy.setupConfigRootFoundInParent({ startPath, configRootPath: repoRoot });
    },

    setupProjectRootFoundAtStart: ({ startPath }: { startPath: string }): void => {
      projectRootProxy.setupProjectRootFoundInDirectory({ directoryPath: startPath });
    },

    setupProjectRootFoundInParent: ({
      startPath,
      parentPath,
      projectRoot,
    }: {
      startPath: string;
      parentPath: string;
      projectRoot: string;
    }): void => {
      projectRootProxy.setupProjectRootFoundInParent({
        startPath,
        parentPath,
        projectRootPath: projectRoot,
      });
    },

    setupGuildPathFoundAtStart: ({ startPath }: { startPath: string }): void => {
      guildWalkProxy.setupGuildFoundAtStart({ startPath });
    },

    setupGuildPathFoundInParent: ({
      startPath,
      guildPath,
    }: {
      startPath: string;
      guildPath: string;
    }): void => {
      guildWalkProxy.setupGuildFoundInParent({ startPath, guildPath });
    },

    setupGuildPathNotFound: ({ startPath }: { startPath: string }): void => {
      guildWalkProxy.setupGuildNotFound({ startPath });
    },

    setupDungeonmasterHomeFromHomedir: ({
      homeDir,
      homePath,
    }: {
      homeDir: string;
      homePath: string;
    }): void => {
      dungeonmasterHomeProxy.clearHomeEnv();
      dungeonmasterHomeProxy.setupHomePath({ homeDir, homePath: homePath as never });
    },

    setupDungeonmasterHomeFromEnv: ({ homePath }: { homePath: string }): void => {
      dungeonmasterHomeProxy.setHomeEnv({ value: homePath });
    },

    clearDungeonmasterHomeEnv: (): void => {
      dungeonmasterHomeProxy.clearHomeEnv();
    },
  };
};
