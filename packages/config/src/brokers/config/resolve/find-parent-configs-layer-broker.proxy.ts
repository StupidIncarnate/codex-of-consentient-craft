import { configFileFindBrokerProxy } from '../../config-file/find/config-file-find-broker.proxy';
import { configFileLoadBrokerProxy } from '../../config-file/load/config-file-load-broker.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';
import type { QuestmaestroConfig } from '../../../contracts/questmaestro-config/questmaestro-config-contract';

export const findParentConfigsLayerBrokerProxy = (): {
  setupSameConfigFound: (params: { currentPath: string; originalConfigPath: string }) => void;
  setupMonorepoRootFound: (params: {
    currentPath: string;
    parentConfigPath: string;
    parentConfig: QuestmaestroConfig;
  }) => void;
  setupNoParentFound: (params: { currentPath: string }) => void;
  setupPackageWithParent: (params: {
    currentPath: string;
    originalConfigPath: string;
    parentConfigPath: string;
    parentConfig: QuestmaestroConfig;
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
      parentConfig: QuestmaestroConfig;
    }) => {
      configFileFindProxy.setupConfigFound({
        startPath: currentPath,
        configPath: parentConfigPath,
      });
      configFileLoadProxy.setupValidConfig({ config: parentConfig });
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
      parentConfig: QuestmaestroConfig;
      grandparentPath: string;
    }) => {
      // First call finds parent
      configFileFindProxy.setupConfigFound({
        startPath: currentPath,
        configPath: parentConfigPath,
      });
      configFileLoadProxy.setupValidConfig({ config: parentConfig });
      pathDirnameProxy.returns({ result: grandparentPath as never });
      // Recursive call finds same config (stops)
      configFileFindProxy.setupConfigFound({
        startPath: grandparentPath,
        configPath: originalConfigPath,
      });
    },
  };
};
