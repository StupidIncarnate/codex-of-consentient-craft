import { configRootFindBrokerProxy } from '../../config-root/find/config-root-find-broker.proxy';

export const locationsClaudeSettingsPathFindBrokerProxy = (): {
  setupSettingsPath: (params: { startPath: string; configRootPath: string }) => void;
} => {
  const configRootProxy = configRootFindBrokerProxy();

  return {
    setupSettingsPath: ({
      startPath,
      configRootPath,
    }: {
      startPath: string;
      configRootPath: string;
    }): void => {
      configRootProxy.setupConfigRootFoundInParent({ startPath, configRootPath });
    },
  };
};
