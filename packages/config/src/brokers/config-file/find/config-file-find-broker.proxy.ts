import { configRootFindBrokerProxy } from '@dungeonmaster/shared/testing';
import { fsAccessAdapterProxy } from '../../../adapters/fs/access/fs-access-adapter.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';

export const configFileFindBrokerProxy = (): {
  setupConfigFound: (params: { startPath: string; configPath: string }) => void;
  setupConfigFoundJson: (params: { startPath: string; configPath: string }) => void;
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
  const fsAccessProxy = fsAccessAdapterProxy();

  return {
    // Legacy filename match (.dungeonmaster): after root found, .json probe fails, legacy returned.
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
      // Broker probes .json first, fails, then returns legacy path.
      pathJoinProxy.returns({ result: `${directory}/.dungeonmaster.json` as never });
      fsAccessProxy.rejects({ error: new Error('ENOENT') });
      pathJoinProxy.returns({ result: configPath as never });
    },

    // New filename match (.dungeonmaster.json): .json probe succeeds, that path returned.
    setupConfigFoundJson: ({
      startPath,
      configPath,
    }: {
      startPath: string;
      configPath: string;
    }): void => {
      const lastSlashIndex = startPath.lastIndexOf('/');
      const directory = lastSlashIndex === 0 ? '/' : startPath.substring(0, lastSlashIndex);
      pathDirnameProxy.returns({ result: directory as never });
      configRootProxy.setupConfigRootFoundJson({
        startPath: directory,
        configRootPath: directory,
      });
      pathJoinProxy.returns({ result: configPath as never });
      fsAccessProxy.resolves();
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
      // After root found, broker probes .json at parent, fails, returns legacy configPath.
      pathJoinProxy.returns({ result: `${parentPath}/.dungeonmaster.json` as never });
      fsAccessProxy.rejects({ error: new Error('ENOENT') });
      pathJoinProxy.returns({ result: configPath as never });
    },
  };
};
