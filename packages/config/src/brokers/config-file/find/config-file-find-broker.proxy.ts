import { configRootFindBrokerProxy } from '@dungeonmaster/shared/testing';
import { dirname } from '#gateway/node/path';

export const configFileFindBrokerProxy = (): {
  setupConfigFound: (params: { startPath: string; configPath: string }) => void;
  setupConfigNotFound: (params: { startPath: string }) => void;
  setupConfigFoundInParent: (params: {
    startPath: string;
    parentPath: string;
    configPath: string;
  }) => void;
} => {
  const configRootProxy = configRootFindBrokerProxy();

  // dirname and join are real here (#gateway/node/path is a plain pass-through with no proxy of
  // its own): dirname computed below to know what startPath configRootFindBroker actually gets
  // called with, and join runs for real on the mocked configRootFindBroker's output, so it needs
  // no staging at all — only configRootFindBrokerProxy is composed.

  return {
    setupConfigFound: ({
      startPath,
      configPath: _configPath,
    }: {
      startPath: string;
      configPath: string;
    }): void => {
      const directory = dirname(startPath);
      configRootProxy.setupConfigRootFound({ startPath: directory, configRootPath: directory });
    },

    setupConfigNotFound: ({ startPath }: { startPath: string }): void => {
      const directory = dirname(startPath);
      configRootProxy.setupConfigRootNotFound({ startPath: directory });
    },

    setupConfigFoundInParent: ({
      startPath,
      parentPath,
      configPath: _configPath,
    }: {
      startPath: string;
      parentPath: string;
      configPath: string;
    }): void => {
      const directory = dirname(startPath);
      configRootProxy.setupConfigRootFoundInParent({
        startPath: directory,
        configRootPath: parentPath,
      });
    },
  };
};
