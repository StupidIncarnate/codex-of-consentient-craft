import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

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
        contents: JSON.stringify(config),
      });
    },

    setupInvalidJson: ({ configPath }: { configPath: string }) => {
      readFileHandle.returns({
        path: configPath,
        contents: '{ invalid json }',
      });
    },

    setupFileNotFound: ({ configPath }: { configPath: string }) => {
      readFileHandle.missing({ path: configPath });
    },
  };
};
