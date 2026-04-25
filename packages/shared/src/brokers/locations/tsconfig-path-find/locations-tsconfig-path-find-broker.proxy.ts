import { fsAccessAdapterProxy } from '../../../adapters/fs/access/fs-access-adapter.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';

export const locationsTsconfigPathFindBrokerProxy = (): {
  setupTsconfigFound: (params: { searchPath: string }) => void;
  setupTsconfigNotFound: (params: { searchPath: string }) => void;
  setupTsconfigMissingWithParent: (params: { searchPath: string; parentPath: string }) => void;
} => {
  const fsAccessProxy = fsAccessAdapterProxy();
  const pathDirnameProxy = pathDirnameAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupTsconfigFound: ({ searchPath }: { searchPath: string }): void => {
      pathJoinProxy.returns({ result: `${searchPath}/tsconfig.json` as never });
      fsAccessProxy.resolves();
    },

    setupTsconfigNotFound: ({ searchPath }: { searchPath: string }): void => {
      pathJoinProxy.returns({ result: `${searchPath}/tsconfig.json` as never });
      fsAccessProxy.rejects({ error: new Error('ENOENT') });
      pathDirnameProxy.returns({ result: searchPath as never });
    },

    setupTsconfigMissingWithParent: ({
      searchPath,
      parentPath,
    }: {
      searchPath: string;
      parentPath: string;
    }): void => {
      pathJoinProxy.returns({ result: `${searchPath}/tsconfig.json` as never });
      fsAccessProxy.rejects({ error: new Error('ENOENT') });
      pathDirnameProxy.returns({ result: parentPath as never });
    },
  };
};
