import type { Dirent } from 'fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';

export const listWalkedFolderFilesLayerBrokerProxy = (): {
  implementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();
  return {
    implementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      readdirProxy.setupReaddirImplementation({ fn });
    },
  };
};
