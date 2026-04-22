import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';

export const portConfigWalkBrokerProxy = (): {
  setupPortFound: (params: { dir: string; port: number }) => void;
  setupConfigMissing: (params: { dir: string; parentDir: string }) => void;
  setupWalkToRoot: (params: { startDir: string }) => void;
  setupPortFoundInParent: (params: { startDir: string; parentDir: string; port: number }) => void;
} => {
  const fsReadProxy = fsReadFileSyncAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const pathDirnameProxy = pathDirnameAdapterProxy();

  return {
    setupPortFound: ({ dir, port }: { dir: string; port: number }): void => {
      pathJoinProxy.returns({ result: `${dir}/.dungeonmaster.json` as never });
      fsReadProxy.returns({
        content: JSON.stringify({ dungeonmaster: { port } }) as never,
      });
    },

    setupConfigMissing: ({ dir, parentDir }: { dir: string; parentDir: string }): void => {
      pathJoinProxy.returns({ result: `${dir}/.dungeonmaster.json` as never });
      fsReadProxy.throws({ error: new Error('ENOENT') });
      pathDirnameProxy.returns({ result: parentDir as never });
    },

    setupWalkToRoot: ({ startDir }: { startDir: string }): void => {
      pathJoinProxy.returns({ result: `${startDir}/.dungeonmaster.json` as never });
      fsReadProxy.throws({ error: new Error('ENOENT') });
      pathDirnameProxy.returns({ result: startDir as never });
    },

    setupPortFoundInParent: ({
      startDir,
      parentDir,
      port,
    }: {
      startDir: string;
      parentDir: string;
      port: number;
    }): void => {
      pathJoinProxy.returns({ result: `${startDir}/.dungeonmaster.json` as never });
      fsReadProxy.throws({ error: new Error('ENOENT') });
      pathDirnameProxy.returns({ result: parentDir as never });
      pathJoinProxy.returns({ result: `${parentDir}/.dungeonmaster.json` as never });
      fsReadProxy.returns({
        content: JSON.stringify({ dungeonmaster: { port } }) as never,
      });
    },
  };
};
