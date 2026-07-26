import { configFileFindBrokerProxy } from '../../config-file/find/config-file-find-broker.proxy';
import { configFileLoadBrokerProxy } from '../../config-file/load/config-file-load-broker.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';
import type { DungeonmasterConfig } from '../../../contracts/dungeonmaster-config/dungeonmaster-config-contract';

export const findParentConfigsLayerBrokerProxy = (): {
  setupSameConfigFound: (params: { currentPath: string; originalConfigPath: string }) => void;
  setupMonorepoRootFound: (params: {
    currentPath: string;
    parentConfigPath: string;
    parentConfig: DungeonmasterConfig;
  }) => void;
  setupNoParentFound: (params: { currentPath: string }) => void;
  setupPackageWithParent: (params: {
    currentPath: string;
    originalConfigPath: string;
    parentConfigPath: string;
    parentConfig: DungeonmasterConfig;
    grandparentPath: string;
  }) => void;
} => {
  const configFileFindProxy = configFileFindBrokerProxy();
  const configFileLoadProxy = configFileLoadBrokerProxy();
  const pathDirnameProxy = pathDirnameAdapterProxy();

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

    setupPackageWithParent: ({
      currentPath,
      originalConfigPath,
      parentConfigPath,
      parentConfig,
      grandparentPath,
    }: {
      currentPath: string;
      originalConfigPath: string;
      parentConfigPath: string;
      parentConfig: DungeonmasterConfig;
      grandparentPath: string;
    }) => {
      // First call finds parent
      configFileFindProxy.setupConfigFound({
        startPath: currentPath,
        configPath: parentConfigPath,
      });
      configFileLoadProxy.setupValidConfig({
        configPath: parentConfigPath as never,
        config: parentConfig,
      });
      // dirname is called on parentConfigPath (the config file just loaded) to compute the
      // next directory to search from. dirname is call-order-scoped (see THE
      // JOIN/DIRNAME/BASENAME TRAP in path-dirname-adapter.proxy.ts), so this just answers
      // "the next dirname() call".
      pathDirnameProxy.returns({ result: grandparentPath as never });
      // Recursive call finds same config (stops)
      configFileFindProxy.setupConfigFound({
        startPath: grandparentPath,
        configPath: originalConfigPath,
      });
    },
  };
};
