import type { Dirent } from 'fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const listWidgetFilesLayerBrokerProxy = (): {
  setupFlatWidgetsDir: ({
    widgetsDirPath,
    filePaths,
  }: {
    widgetsDirPath: AbsoluteFilePath;
    filePaths: AbsoluteFilePath[];
  }) => void;
  setupEmpty: ({ widgetsDirPath }: { widgetsDirPath: AbsoluteFilePath }) => void;
  setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();

  return {
    setupFlatWidgetsDir: ({
      widgetsDirPath,
      filePaths,
    }: {
      widgetsDirPath: AbsoluteFilePath;
      filePaths: AbsoluteFilePath[];
    }): void => {
      const names = filePaths.map((fp) => {
        const parts = String(fp).split('/');
        return parts[parts.length - 1] ?? String(fp);
      });
      readdirProxy.setupFiles({ dirPath: widgetsDirPath, names });
    },

    setupEmpty: ({ widgetsDirPath }: { widgetsDirPath: AbsoluteFilePath }): void => {
      readdirProxy.setupEmpty({ dirPath: widgetsDirPath });
    },

    setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      readdirProxy.setupImplementation({ fn });
    },
  };
};
