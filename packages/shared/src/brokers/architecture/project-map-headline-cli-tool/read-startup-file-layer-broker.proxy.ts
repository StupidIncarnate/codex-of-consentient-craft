import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import type { Dirent } from 'fs';

const buildFileDirent = ({ name }: { name: string }): Dirent =>
  ({
    name,
    parentPath: '/stub',
    path: '/stub',
    isDirectory: () => false,
    isFile: () => true,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

export const readStartupFileLayerBrokerProxy = (): {
  setup: ({ fileName, source }: { fileName: string; source: ContentText }) => void;
  setupEmpty: () => void;
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();
  const readProxy = fsReadFileSyncAdapterProxy();

  return {
    setup: ({ fileName, source }: { fileName: string; source: ContentText }): void => {
      readdirProxy.returns({ entries: [buildFileDirent({ name: fileName })] });
      readProxy.returns({ content: source });
    },

    setupEmpty: (): void => {
      readdirProxy.returns({ entries: [] });
    },

    setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      readProxy.implementation({ fn });
    },
  };
};
