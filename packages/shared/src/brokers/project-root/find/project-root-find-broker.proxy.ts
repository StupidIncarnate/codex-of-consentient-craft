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
  setupProjectRootFoundInDirectory: (params: { directoryPath: string }) => void;
  setupProjectRootFoundInDirectoryParent: (params: {
    directoryPath: string;
    projectRootPath: string;
  }) => void;
} => {
  const fsAccessProxy = fsAccessAdapterProxy();
  const pathDirnameProxy = pathDirnameAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupProjectRootFound: ({
      startPath,
      projectRootPath,
    }: {
      startPath: string;
      projectRootPath: string;
    }) => {
      // First check: startPath itself (for directory paths) - reject since it's a file path
      pathJoinProxy.returns({ result: `${startPath}/package.json` as never });
      fsAccessProxy.rejects({ error: new Error('ENOENT') });
      // Second check: parent directory (project root)
      pathDirnameProxy.returns({ result: projectRootPath as never });
      pathJoinProxy.returns({ result: `${projectRootPath}/package.json` as never });
      fsAccessProxy.resolves();
    },

    setupProjectRootNotFound: ({ startPath }: { startPath: string }) => {
      const lastSlashIndex = startPath.lastIndexOf('/');
      const directory = lastSlashIndex === 0 ? '/' : startPath.substring(0, lastSlashIndex);
      // First check: startPath itself - reject
      pathJoinProxy.returns({ result: `${startPath}/package.json` as never });
      fsAccessProxy.rejects({ error: new Error('ENOENT') });
      // Second check: parent directory - reject
      pathDirnameProxy.returns({ result: directory as never });
      pathJoinProxy.returns({ result: `${directory}/package.json` as never });
      fsAccessProxy.rejects({ error: new Error('ENOENT') });
      // Simulate reaching root
      pathDirnameProxy.returns({ result: directory as never });
    },

    setupProjectRootFoundInParent: ({
      startPath,
      parentPath: _parentPath,
      projectRootPath,
    }: {
      startPath: string;
      parentPath: string;
      projectRootPath: string;
    }) => {
      const lastSlashIndex = startPath.lastIndexOf('/');
      const directory = lastSlashIndex === 0 ? '/' : startPath.substring(0, lastSlashIndex);
      // First check: startPath itself - reject
      pathJoinProxy.returns({ result: `${startPath}/package.json` as never });
      fsAccessProxy.rejects({ error: new Error('ENOENT') });
      // Second check: parent of startPath - reject
      pathDirnameProxy.returns({ result: directory as never });
      pathJoinProxy.returns({ result: `${directory}/package.json` as never });
      fsAccessProxy.rejects({ error: new Error('ENOENT') });
      // Third check: move to parent where package.json exists
      pathDirnameProxy.returns({ result: projectRootPath as never });
      pathJoinProxy.returns({ result: `${projectRootPath}/package.json` as never });
      fsAccessProxy.resolves();
    },

    setupProjectRootFoundInDirectory: ({ directoryPath }: { directoryPath: string }) => {
      // When startPath is a directory, check the directory itself first
      pathJoinProxy.returns({ result: `${directoryPath}/package.json` as never });
      fsAccessProxy.resolves();
    },

    setupProjectRootFoundInDirectoryParent: ({
      directoryPath,
      projectRootPath,
    }: {
      directoryPath: string;
      projectRootPath: string;
    }) => {
      // First check: startPath directory itself - no package.json
      pathJoinProxy.returns({ result: `${directoryPath}/package.json` as never });
      fsAccessProxy.rejects({ error: new Error('ENOENT') });
      // Then check parent directory
      pathDirnameProxy.returns({ result: projectRootPath as never });
      pathJoinProxy.returns({ result: `${projectRootPath}/package.json` as never });
      fsAccessProxy.resolves();
    },
  };
};
