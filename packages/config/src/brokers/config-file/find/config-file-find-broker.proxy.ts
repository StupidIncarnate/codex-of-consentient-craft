import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { configRootFindBrokerProxy } from '@dungeonmaster/shared/testing';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
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

  // The broker calls dirname(startPath) itself, before configRootFindBroker runs. The shared proxy
  // has already mocked `dirname` from '#gateway/node/path', so this stages that one exact call as
  // a real passthrough and reads the directory from the real function.
  const realPath = requireActual<{ dirname: typeof dirname }>({ module: 'path' });
  const dirnameHandle = registerMock({ fn: dirname });

  const directoryOf = ({ startPath }: { startPath: string }): FilePath => {
    dirnameHandle.calledWith([startPath]).implement(realPath.dirname);
    return filePathContract.parse(realPath.dirname(startPath));
  };

  return {
    setupConfigFound: ({
      startPath,
      configPath: _configPath,
    }: {
      startPath: string;
      configPath: string;
    }): void => {
      const directory = directoryOf({ startPath });
      configRootProxy.setupConfigRootFound({ startPath: directory, configRootPath: directory });
    },

    setupConfigNotFound: ({ startPath }: { startPath: string }): void => {
      const directory = directoryOf({ startPath });
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
      const directory = directoryOf({ startPath });
      configRootProxy.setupConfigRootFoundInParent({
        startPath: directory,
        configRootPath: parentPath,
      });
    },
  };
};
