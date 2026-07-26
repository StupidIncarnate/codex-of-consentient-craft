import type { FilePath } from '@dungeonmaster/shared/contracts';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';

export const configFileLoadBrokerProxy = (): {
  setupValidConfig: (params: { configPath: FilePath; config: Record<string, unknown> }) => void;
  setupInvalidJson: (params: { configPath: FilePath }) => void;
  setupFileNotFound: (params: { configPath: FilePath }) => void;
} => {
  const fsProxy = fsReadFileAdapterProxy();

  return {
    setupValidConfig: ({
      configPath,
      config,
    }: {
      configPath: FilePath;
      config: Record<string, unknown>;
    }) => {
      fsProxy.returns({
        filePath: configPath,
        contents: FileContentsStub({ value: JSON.stringify(config) }),
      });
    },

    setupInvalidJson: ({ configPath }: { configPath: FilePath }) => {
      fsProxy.returns({
        filePath: configPath,
        contents: FileContentsStub({ value: '{ invalid json }' }),
      });
    },

    setupFileNotFound: ({ configPath }: { configPath: FilePath }) => {
      fsProxy.throws({
        filePath: configPath,
        error: new Error('ENOENT: no such file or directory'),
      });
    },
  };
};
