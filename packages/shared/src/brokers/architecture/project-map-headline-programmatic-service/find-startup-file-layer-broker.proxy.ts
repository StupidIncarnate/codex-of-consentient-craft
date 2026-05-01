import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import type { Dirent } from 'fs';

export const findStartupFileLayerBrokerProxy = (): {
  setupStartupFiles: ({ names }: { names: string[] }) => void;
  setupEmpty: () => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();

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

  return {
    setupStartupFiles: ({ names }: { names: string[] }): void => {
      readdirProxy.returns({ entries: names.map((name) => buildFileDirent({ name })) });
    },

    setupEmpty: (): void => {
      readdirProxy.returns({ entries: [] });
    },
  };
};
