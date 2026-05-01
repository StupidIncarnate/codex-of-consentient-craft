import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import type { Dirent } from 'fs';

export const listFlowFilesLayerBrokerProxy = (): {
  returns: ({ entries }: { entries: Dirent[] }) => void;
  implementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();

  return {
    returns: ({ entries }: { entries: Dirent[] }): void => {
      readdirProxy.returns({ entries });
    },
    implementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      readdirProxy.implementation({ fn });
    },
  };
};
