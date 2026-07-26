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
  // join/dirname are call-order-scoped here, not argument-keyed — see THE JOIN/DIRNAME/BASENAME
  // TRAP comment in path-join-adapter.proxy.ts. The segments/path each call receives are the
  // output of another mocked call further down the composed chain, so there's no fixed
  // argument to key on; `.returns()` just answers "the next call", matching
  // @dungeonmaster/shared's own path adapter proxies.
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
      // dirname is called on the broker's own startPath; join is then called on the
      // config-root result (== directory here, per configRootProxy.setupConfigRootFound below)
      // plus the fixed project-config filename.
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
      // Here configRootFindBroker resolves to parentPath, not directory, so that's the
      // directory the final join call in configFileFindBroker joins with.
      pathJoinProxy.returns({ result: configPath as never });
    },
  };
};
