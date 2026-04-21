import { fsAccessAdapterProxy } from '../../../adapters/fs/access/fs-access-adapter.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';

export const configRootFindBrokerProxy = (): {
  setupConfigRootFound: (params: { startPath: string; configRootPath: string }) => void;
  setupConfigRootFoundJson: (params: { startPath: string; configRootPath: string }) => void;
  setupConfigRootNotFound: (params: { startPath: string }) => void;
  setupConfigRootFoundInParent: (params: { startPath: string; configRootPath: string }) => void;
} => {
  const fsAccessProxy = fsAccessAdapterProxy();
  const pathDirnameProxy = pathDirnameAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    // Legacy filename match (.dungeonmaster). Models broker's sequence:
    // probe .json → reject; probe legacy → resolve.
    setupConfigRootFound: ({
      startPath,
      configRootPath: _configRootPath,
    }: {
      startPath: string;
      configRootPath: string;
    }): void => {
      pathJoinProxy.returns({ result: `${startPath}/.dungeonmaster.json` as never });
      fsAccessProxy.rejects({ error: new Error('ENOENT') });
      pathJoinProxy.returns({ result: `${startPath}/.dungeonmaster` as never });
      fsAccessProxy.resolves();
    },

    // New filename match (.dungeonmaster.json). Broker probes .json first and resolves.
    setupConfigRootFoundJson: ({
      startPath,
      configRootPath: _configRootPath,
    }: {
      startPath: string;
      configRootPath: string;
    }): void => {
      pathJoinProxy.returns({ result: `${startPath}/.dungeonmaster.json` as never });
      fsAccessProxy.resolves();
    },

    setupConfigRootNotFound: ({ startPath }: { startPath: string }): void => {
      pathJoinProxy.returns({ result: `${startPath}/.dungeonmaster.json` as never });
      fsAccessProxy.rejects({ error: new Error('ENOENT') });
      pathJoinProxy.returns({ result: `${startPath}/.dungeonmaster` as never });
      fsAccessProxy.rejects({ error: new Error('ENOENT') });
      pathDirnameProxy.returns({ result: startPath as never });
    },

    setupConfigRootFoundInParent: ({
      startPath,
      configRootPath,
    }: {
      startPath: string;
      configRootPath: string;
    }): void => {
      // startPath: both candidates miss
      pathJoinProxy.returns({ result: `${startPath}/.dungeonmaster.json` as never });
      fsAccessProxy.rejects({ error: new Error('ENOENT') });
      pathJoinProxy.returns({ result: `${startPath}/.dungeonmaster` as never });
      fsAccessProxy.rejects({ error: new Error('ENOENT') });
      pathDirnameProxy.returns({ result: configRootPath as never });
      // parent (configRootPath): .json missing, legacy resolves
      pathJoinProxy.returns({ result: `${configRootPath}/.dungeonmaster.json` as never });
      fsAccessProxy.rejects({ error: new Error('ENOENT') });
      pathJoinProxy.returns({ result: `${configRootPath}/.dungeonmaster` as never });
      fsAccessProxy.resolves();
    },
  };
};
