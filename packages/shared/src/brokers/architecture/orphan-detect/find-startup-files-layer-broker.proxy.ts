import type { Dirent } from 'fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';

export const findStartupFilesLayerBrokerProxy = (): {
  setupReturns: ({ entries }: { entries: Dirent[] }) => void;
  setupReaddirThrows: ({ error }: { error: Error }) => void;
  setupReaddirImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();
  return {
    setupReturns: ({ entries }: { entries: Dirent[] }): void => {
      readdirProxy.setupReaddirReturns({ entries });
    },
    setupReaddirThrows: ({ error }: { error: Error }): void => {
      readdirProxy.setupReaddirThrows({ error });
    },
    setupReaddirImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      readdirProxy.setupReaddirImplementation({ fn });
    },
  };
};
