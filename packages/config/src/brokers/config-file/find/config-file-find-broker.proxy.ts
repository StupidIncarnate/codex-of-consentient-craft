import { configRootFindBrokerProxy } from '@dungeonmaster/shared/testing';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';

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
  const pathDirnameProxy = pathDirnameAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupConfigFound: ({
      startPath,
      configPath,
    }: {
      startPath: string;
      configPath: string;
    }): void => {
      const lastSlashIndex = startPath.lastIndexOf('/');
      const directory = lastSlashIndex === 0 ? '/' : startPath.substring(0, lastSlashIndex);
      pathDirnameProxy.returns({ result: directory as never });
      configRootProxy.setupConfigRootFound({ startPath: directory, configRootPath: directory });
      pathJoinProxy.returns({ result: configPath as never });
    },

    setupConfigNotFound: ({ startPath }: { startPath: string }): void => {
      const lastSlashIndex = startPath.lastIndexOf('/');
      const directory = lastSlashIndex === 0 ? '/' : startPath.substring(0, lastSlashIndex);
      pathDirnameProxy.returns({ result: directory as never });
      configRootProxy.setupConfigRootNotFound({ startPath: directory });
    },

    setupConfigFoundInParent: ({
      startPath,
      parentPath,
      configPath,
    }: {
      startPath: string;
      parentPath: string;
      configPath: string;
    }): void => {
      const lastSlashIndex = startPath.lastIndexOf('/');
      const directory = lastSlashIndex === 0 ? '/' : startPath.substring(0, lastSlashIndex);
      pathDirnameProxy.returns({ result: directory as never });
      configRootProxy.setupConfigRootFoundInParent({
        startPath: directory,
        configRootPath: parentPath,
      });
      pathJoinProxy.returns({ result: configPath as never });
    },
  };
};
