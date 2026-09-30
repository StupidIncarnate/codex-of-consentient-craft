import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { FileContentsStub } from '@dungeonmaster/shared/contracts/file-contents/file-contents.stub';

export const configFileLoadBrokerProxy = (): {
  setupValidConfig: (params: { configPath: string; config: Record<string, unknown> }) => void;
  setupInvalidJson: (params: { configPath: string }) => void;
  setupFileNotFound: (params: { configPath: string }) => void;
} => {
  const readFileHandle = readFileProxy();

  return {
    setupValidConfig: ({
      configPath,
      config,
    }: {
      configPath: string;
      config: Record<string, unknown>;
    }) => {
      readFileHandle.returns({
        path: configPath,
        contents: FileContentsStub({ value: JSON.stringify(config) }),
      });
    },

    setupInvalidJson: ({ configPath }: { configPath: string }) => {
      readFileHandle.returns({
        path: configPath,
        contents: FileContentsStub({ value: '{ invalid json }' }),
      });
    },

    setupFileNotFound: ({ configPath }: { configPath: string }) => {
      readFileHandle.missing({ path: configPath });
    },
  };
};
