import { fsAccessAdapterProxy } from '../../../adapters/fs/access/fs-access-adapter.proxy';
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
  const fsAccessProxy = fsAccessAdapterProxy();
  const pathDirnameProxy = pathDirnameAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupConfigFound: ({ startPath, configPath }: { startPath: string; configPath: string }) => {
      const lastSlashIndex = startPath.lastIndexOf('/');
      const directory = lastSlashIndex === 0 ? '/' : startPath.substring(0, lastSlashIndex);
      pathDirnameProxy.returns({ result: directory as never });
      pathJoinProxy.returns({ result: configPath as never });
      fsAccessProxy.resolves();
    },

    setupConfigNotFound: ({ startPath }: { startPath: string }) => {
      const lastSlashIndex = startPath.lastIndexOf('/');
      const directory = lastSlashIndex === 0 ? '/' : startPath.substring(0, lastSlashIndex);
      pathDirnameProxy.returns({ result: directory as never });
      pathJoinProxy.returns({ result: `${directory}/.questmaestro` as never });
      fsAccessProxy.rejects({ error: new Error('ENOENT: no such file or directory') });
      // Simulate reaching root
      pathDirnameProxy.returns({ result: directory as never });
    },

    setupConfigFoundInParent: ({
      startPath,
      parentPath,
      configPath,
    }: {
      startPath: string;
      parentPath: string;
      configPath: string;
    }) => {
      const lastSlashIndex = startPath.lastIndexOf('/');
      const directory = lastSlashIndex === 0 ? '/' : startPath.substring(0, lastSlashIndex);
      // First attempt in current directory
      pathDirnameProxy.returns({ result: directory as never });
      pathJoinProxy.returns({ result: `${directory}/.questmaestro` as never });
      fsAccessProxy.rejects({ error: new Error('ENOENT') });
      // Move to parent
      pathDirnameProxy.returns({ result: parentPath as never });
      pathJoinProxy.returns({ result: configPath as never });
      fsAccessProxy.resolves();
    },
  };
};
