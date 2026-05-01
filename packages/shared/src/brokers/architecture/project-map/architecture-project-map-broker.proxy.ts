import type { Dirent } from 'fs';
import { architecturePackageInventoryBrokerProxy } from '../package-inventory/architecture-package-inventory-broker.proxy';
import { discoverPackagesLayerBrokerProxy } from './discover-packages-layer-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

const makeDirent = ({ name, isDir }: { name: string; isDir: boolean }): Dirent =>
  ({
    name,
    parentPath: '/stub',
    path: '/stub',
    isDirectory: () => isDir,
    isFile: () => !isDir,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

export const architectureProjectMapBrokerProxy = (): {
  setupMonorepo: ({
    packages,
  }: {
    packages: {
      name: string;
      description?: ContentText;
      folders: {
        name: string;
        entries: { name: string; isDir: boolean }[];
        subEntries?: Record<string, { name: string; isDir: boolean }[]>;
      }[];
    }[];
  }) => void;
  setupSingleRepo: ({
    folders,
    description,
  }: {
    folders: {
      name: string;
      entries: { name: string; isDir: boolean }[];
      subEntries?: Record<string, { name: string; isDir: boolean }[]>;
    }[];
    description?: ContentText;
  }) => void;
  setupEmptySrc: () => void;
} => {
  const discoverProxy = discoverPackagesLayerBrokerProxy();
  const inventoryProxy = architecturePackageInventoryBrokerProxy();

  return {
    setupMonorepo: ({
      packages,
    }: {
      packages: {
        name: string;
        description?: ContentText;
        folders: {
          name: string;
          entries: { name: string; isDir: boolean }[];
          subEntries?: Record<string, { name: string; isDir: boolean }[]>;
        }[];
      }[];
    }): void => {
      discoverProxy.setupPackages({
        entries: packages.map((pkg) => makeDirent({ name: pkg.name, isDir: true })),
      });
      inventoryProxy.setupMonorepoPackages({ packages });
    },

    setupSingleRepo: ({
      folders,
      description,
    }: {
      folders: {
        name: string;
        entries: { name: string; isDir: boolean }[];
        subEntries?: Record<string, { name: string; isDir: boolean }[]>;
      }[];
      description?: ContentText;
    }): void => {
      discoverProxy.setupMissingPackagesDir();
      inventoryProxy.setupSingleRepo({
        folders,
        ...(description !== undefined && { description }),
      });
    },

    setupEmptySrc: (): void => {
      discoverProxy.setupMissingPackagesDir();
      inventoryProxy.setupEmptySrc();
    },
  };
};
