import type { Dirent } from '#gateway/node/fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';

export const listWidgetFilesLayerBrokerProxy = (): {
  setupFlatWidgetsDir: ({
    widgetsDirPath,
    filePaths,
  }: {
    widgetsDirPath: string;
    filePaths: string[];
  }) => void;
  setupEmpty: ({ widgetsDirPath }: { widgetsDirPath: string }) => void;
  setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();

  return {
    setupFlatWidgetsDir: ({
      widgetsDirPath,
      filePaths,
    }: {
      widgetsDirPath: string;
      filePaths: string[];
    }): void => {
      const names = filePaths.map((fp) => {
        const parts = fp.split('/');
        return parts[parts.length - 1] ?? fp;
      });
      readdirProxy.setupFiles({ dirPath: widgetsDirPath, names });
    },

    setupEmpty: ({ widgetsDirPath }: { widgetsDirPath: string }): void => {
      readdirProxy.setupEmpty({ dirPath: widgetsDirPath });
    },

    setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      readdirProxy.setupImplementation({ fn });
    },
  };
};
