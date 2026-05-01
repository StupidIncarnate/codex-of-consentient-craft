import type { Dirent } from 'fs';
import { listDirEntriesLayerBrokerProxy } from './list-dir-entries-layer-broker.proxy';

export const startupFilesFindLayerBrokerProxy = (): {
  setupFiles: ({ names }: { names: string[] }) => void;
  setupEmpty: () => void;
  setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const listProxy = listDirEntriesLayerBrokerProxy();

  return {
    setupFiles: ({ names }: { names: string[] }): void => {
      listProxy.setupFiles({ names });
    },

    setupEmpty: (): void => {
      listProxy.setupEmpty();
    },

    setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      listProxy.setupImplementation({ fn });
    },
  };
};
