import { configRootFindBrokerProxy } from '../../config-root/find/config-root-find-broker.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsClaudeSettingsPathFindBrokerProxy = (): {
  setupSettingsPath: (params: {
    startPath: string;
    configRootPath: string;
    settingsPath: FilePath;
  }) => void;
} => {
  const configRootProxy = configRootFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupSettingsPath: ({
      startPath,
      configRootPath,
      settingsPath,
    }: {
      startPath: string;
      configRootPath: string;
      settingsPath: FilePath;
    }): void => {
      configRootProxy.setupConfigRootFound({ startPath, configRootPath });
      pathJoinProxy.returns({ result: settingsPath });
    },
  };
};
