import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
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

const buildDirDirent = ({ name }: { name: string }): Dirent =>
  ({
    name,
    parentPath: '/stub',
    path: '/stub',
    isDirectory: () => true,
    isFile: () => false,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

export const listRuleFilesLayerBrokerProxy = (): {
  setupRuleDomains: ({ domainNames }: { domainNames: string[] }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();

  return {
    setupRuleDomains: ({ domainNames }: { domainNames: string[] }): void => {
      const domainDirEntries = domainNames.map((name) => buildDirDirent({ name }));

      readdirProxy.implementation({
        fn: (dirPath: string): Dirent[] => {
          if (dirPath.endsWith('/src/brokers/rule')) {
            return domainDirEntries;
          }
          const lastSegment = dirPath.split('/').at(-1) ?? '';
          if (domainNames.includes(lastSegment)) {
            return [buildFileDirent({ name: `rule-${lastSegment}-broker.ts` })];
          }
          return [];
        },
      });
    },
  };
};
