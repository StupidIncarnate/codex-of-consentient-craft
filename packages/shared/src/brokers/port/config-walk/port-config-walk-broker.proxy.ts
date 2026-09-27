import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import { dirname, join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { dungeonmasterHomeStatics } from '../../../statics/dungeonmaster-home/dungeonmaster-home-statics';

type AbsoluteFilePath = ReturnType<typeof AbsoluteFilePathStub>;

export const portConfigWalkBrokerProxy = (): {
  setupPortFound: (params: { dir: string; port: number }) => void;
  setupConfigMissing: (params: { dir: string; parentDir: string }) => void;
  setupWalkToRoot: (params: { startDir: string }) => void;
  setupPortFoundInParent: (params: { startDir: string; parentDir: string; port: number }) => void;
} => {
  const fsReadProxy = readFileSyncProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports. Every call is staged on the EXACT (dir, configFile) or (dir)
  // tuple the broker really passes, never an address-less catch-all.
  const joinHandle = registerMock({ fn: join });
  const dirnameHandle = registerMock({ fn: dirname });

  const configPathFor = ({ dirPath }: { dirPath: string }): AbsoluteFilePath => {
    const configFile = dungeonmasterHomeStatics.paths.projectConfigFile;
    const configPath = AbsoluteFilePathStub({ value: `${dirPath}/${configFile}` });
    joinHandle.calledWith([dirPath, configFile]).returns(configPath);
    return configPath;
  };

  return {
    setupPortFound: ({ dir, port }: { dir: string; port: number }): void => {
      const configPath = configPathFor({ dirPath: dir });
      fsReadProxy.returns({
        path: configPath,
        contents: JSON.stringify({ dungeonmaster: { port } }),
      });
    },

    setupConfigMissing: ({ dir, parentDir }: { dir: string; parentDir: string }): void => {
      const configPath = configPathFor({ dirPath: dir });
      fsReadProxy.throws({ path: configPath, error: new Error('ENOENT') });
      dirnameHandle.calledWith([dir]).returns(parentDir);
    },

    setupWalkToRoot: ({ startDir }: { startDir: string }): void => {
      const configPath = configPathFor({ dirPath: startDir });
      fsReadProxy.throws({ path: configPath, error: new Error('ENOENT') });
      dirnameHandle.calledWith([startDir]).returns(startDir);
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
      const startConfigPath = configPathFor({ dirPath: startDir });
      fsReadProxy.throws({ path: startConfigPath, error: new Error('ENOENT') });
      dirnameHandle.calledWith([startDir]).returns(parentDir);

      const parentConfigPath = configPathFor({ dirPath: parentDir });
      fsReadProxy.returns({
        path: parentConfigPath,
        contents: JSON.stringify({ dungeonmaster: { port } }),
      });
    },
  };
};
