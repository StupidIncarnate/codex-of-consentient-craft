import { configFileFindBrokerProxy } from '../../config-file/find/config-file-find-broker.proxy';
import { configFileLoadBrokerProxy } from '../../config-file/load/config-file-load-broker.proxy';
import type { DungeonmasterConfig } from '../../../contracts/dungeonmaster-config/dungeonmaster-config-contract';

export const findParentConfigsLayerBrokerProxy = (): {
  setupSameConfigFound: (params: { currentPath: string; originalConfigPath: string }) => void;
  setupMonorepoRootFound: (params: {
    currentPath: string;
    parentConfigPath: string;
    parentConfig: DungeonmasterConfig;
  }) => void;
  setupNoParentFound: (params: { currentPath: string }) => void;
  setupPackageWithParentAndMonorepoGrandparent: (params: {
    currentPath: string;
    parentConfigPath: string;
    parentConfig: DungeonmasterConfig;
    grandparentPath: string;
    grandConfigPath: string;
    grandConfig: DungeonmasterConfig;
  }) => void;
} => {
  const configFileFindProxy = configFileFindBrokerProxy();
  const configFileLoadProxy = configFileLoadBrokerProxy();

  return {
    setupSameConfigFound: ({
      currentPath,
      originalConfigPath,
    }: {
      currentPath: string;
      originalConfigPath: string;
    }) => {
      configFileFindProxy.setupConfigFound({
        startPath: currentPath,
        configPath: originalConfigPath,
      });
    },

    setupMonorepoRootFound: ({
      currentPath,
      parentConfigPath,
      parentConfig,
    }: {
      currentPath: string;
      parentConfigPath: string;
      parentConfig: DungeonmasterConfig;
    }) => {
      configFileFindProxy.setupConfigFound({
        startPath: currentPath,
        configPath: parentConfigPath,
      });
      configFileLoadProxy.setupValidConfig({
        configPath: parentConfigPath as never,
        config: parentConfig,
      });
    },

    setupNoParentFound: ({ currentPath }: { currentPath: string }) => {
      configFileFindProxy.setupConfigNotFound({ startPath: currentPath });
    },

    setupPackageWithParentAndMonorepoGrandparent: ({
      currentPath,
      parentConfigPath,
      parentConfig,
      grandparentPath,
      grandConfigPath,
      grandConfig,
    }: {
      currentPath: string;
      parentConfigPath: string;
      parentConfig: DungeonmasterConfig;
      grandparentPath: string;
      grandConfigPath: string;
      grandConfig: DungeonmasterConfig;
    }) => {
      // First level: finds a non-monorepo parent, so the broker recurses one level further up.
      configFileFindProxy.setupConfigFound({
        startPath: currentPath,
        configPath: parentConfigPath,
      });
      configFileLoadProxy.setupValidConfig({
        configPath: parentConfigPath as never,
        config: parentConfig,
      });
      // dirname is real here (#gateway/node/path is a plain pass-through with no proxy of its
      // own), so grandparentPath must be the actual dirname of parentConfigPath — the recursive
      // call is only reached with the staged startPath below when the broker computes that
      // argument correctly.
      // Second level: finds a monorepo config, so recursion stops here with no further dirname
      // call.
      configFileFindProxy.setupConfigFound({
        startPath: grandparentPath,
        configPath: grandConfigPath,
      });
      configFileLoadProxy.setupValidConfig({
        configPath: grandConfigPath as never,
        config: grandConfig,
      });
    },
  };
};
