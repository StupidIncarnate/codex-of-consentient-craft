import type { FilePath } from '@dungeonmaster/shared/contracts';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';

export const configFileLoadBrokerProxy = (): {
  setupValidConfig: (params: { configPath: FilePath; config: Record<string, unknown> }) => void;
  setupInvalidJson: (params: { configPath: FilePath }) => void;
  setupFileNotFound: (params: { configPath: FilePath }) => void;
} => {
  const readFileHandle = readFileProxy();

  return {
    setupValidConfig: ({
      configPath,
      config,
    }: {
      configPath: FilePath;
      config: Record<string, unknown>;
    }) => {
      readFileHandle.returns({
        path: configPath,
        contents: FileContentsStub({ value: JSON.stringify(config) }),
      });
    },

    setupInvalidJson: ({ configPath }: { configPath: FilePath }) => {
      readFileHandle.returns({
        path: configPath,
        contents: FileContentsStub({ value: '{ invalid json }' }),
      });
    },

    setupFileNotFound: ({ configPath }: { configPath: FilePath }) => {
      readFileHandle.missing({ path: configPath });
    },
  };
};
