import { fsAccessAdapterProxy } from '../../../adapters/fs/access/fs-access-adapter.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';

export const projectRootFindBrokerProxy = (): {
  setupProjectRootFound: (params: { startPath: string; projectRootPath: string }) => void;
  setupProjectRootNotFound: (params: { startPath: string }) => void;
  setupProjectRootFoundInParent: (params: {
    startPath: string;
    parentPath: string;
    projectRootPath: string;
  }) => void;
} => {
  const fsAccessProxy = fsAccessAdapterProxy();
  const pathDirnameProxy = pathDirnameAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupProjectRootFound: ({
      startPath,
      projectRootPath: _projectRootPath,
    }: {
      startPath: string;
      projectRootPath: string;
    }) => {
      const lastSlashIndex = startPath.lastIndexOf('/');
      const directory = lastSlashIndex === 0 ? '/' : startPath.substring(0, lastSlashIndex);
      pathDirnameProxy.returns({ result: directory as never });
      pathJoinProxy.returns({ result: `${directory}/package.json` as never });
      fsAccessProxy.resolves();
    },

    setupProjectRootNotFound: ({ startPath }: { startPath: string }) => {
      const lastSlashIndex = startPath.lastIndexOf('/');
      const directory = lastSlashIndex === 0 ? '/' : startPath.substring(0, lastSlashIndex);
      pathDirnameProxy.returns({ result: directory as never });
      pathJoinProxy.returns({ result: `${directory}/package.json` as never });
      fsAccessProxy.rejects({ error: new Error('ENOENT: no such file or directory') });
      // Simulate reaching root
      pathDirnameProxy.returns({ result: directory as never });
    },

    setupProjectRootFoundInParent: ({
      startPath,
      parentPath,
      projectRootPath: _projectRootPath,
    }: {
      startPath: string;
      parentPath: string;
      projectRootPath: string;
    }) => {
      const lastSlashIndex = startPath.lastIndexOf('/');
      const directory = lastSlashIndex === 0 ? '/' : startPath.substring(0, lastSlashIndex);
      // First attempt in current directory
      pathDirnameProxy.returns({ result: directory as never });
      pathJoinProxy.returns({ result: `${directory}/package.json` as never });
      fsAccessProxy.rejects({ error: new Error('ENOENT') });
      // Move to parent
      pathDirnameProxy.returns({ result: parentPath as never });
      pathJoinProxy.returns({ result: `${parentPath}/package.json` as never });
      fsAccessProxy.resolves();
    },
  };
};
