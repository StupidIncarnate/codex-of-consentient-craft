import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

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
    // portConfigWalkBroker builds filePath by joining dir with the config filename via
    // pathJoinAdapter — the mocked join here returns a real computed path (not ''), so the
    // fs read below is keyed on that same path, not calledWith([]).
    setupPortFound: ({ dir, port }: { dir: string; port: number }): void => {
      const configPath = AbsoluteFilePathStub({ value: `${dir}/.dungeonmaster.json` });
      pathJoinProxy.returns({ result: String(configPath) as never });
      fsReadProxy.returns({
        filePath: configPath,
        content: JSON.stringify({ dungeonmaster: { port } }) as never,
      });
    },

    setupConfigMissing: ({ dir, parentDir }: { dir: string; parentDir: string }): void => {
      const configPath = AbsoluteFilePathStub({ value: `${dir}/.dungeonmaster.json` });
      pathJoinProxy.returns({ result: String(configPath) as never });
      fsReadProxy.throws({ filePath: configPath, error: new Error('ENOENT') });
      pathDirnameProxy.returns({ result: parentDir as never });
    },

    setupWalkToRoot: ({ startDir }: { startDir: string }): void => {
      const configPath = AbsoluteFilePathStub({ value: `${startDir}/.dungeonmaster.json` });
      pathJoinProxy.returns({ result: String(configPath) as never });
      fsReadProxy.throws({ filePath: configPath, error: new Error('ENOENT') });
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
      const startConfigPath = AbsoluteFilePathStub({ value: `${startDir}/.dungeonmaster.json` });
      pathJoinProxy.returns({ result: String(startConfigPath) as never });
      fsReadProxy.throws({ filePath: startConfigPath, error: new Error('ENOENT') });
      pathDirnameProxy.returns({ result: parentDir as never });

      const parentConfigPath = AbsoluteFilePathStub({ value: `${parentDir}/.dungeonmaster.json` });
      pathJoinProxy.returns({ result: String(parentConfigPath) as never });
      fsReadProxy.returns({
        filePath: parentConfigPath,
        content: JSON.stringify({ dungeonmaster: { port } }) as never,
      });
    },
  };
};
