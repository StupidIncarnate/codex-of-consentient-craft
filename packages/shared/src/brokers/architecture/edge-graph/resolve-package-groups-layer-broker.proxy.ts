import type { Dirent } from 'fs';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { readFileLayerBrokerProxy } from './read-file-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';

const buildDirDirent = ({ name }: { name: string }): Dirent =>
  ({
    name,
    isDirectory: () => true,
    isFile: () => false,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

export const resolvePackageGroupsLayerBrokerProxy = (): {
  setupPackagesDir: ({
    projectRoot,
    packageDirNames,
  }: {
    projectRoot: string;
    packageDirNames: readonly string[];
  }) => void;
  setupPackage: (params: {
    packageRoot: string;
    srcDirNames?: readonly string[];
    adapterDirNames?: readonly string[];
    packageJsonContent?: string;
  }) => void;
} => {
  const readdirProxy = safeReaddirLayerBrokerProxy();
  const readFileProxy = readFileLayerBrokerProxy();

  return {
    setupPackagesDir: ({
      projectRoot,
      packageDirNames,
    }: {
      projectRoot: string;
      packageDirNames: readonly string[];
    }): void => {
      readdirProxy.setupDirectory({
        dirPath: AbsoluteFilePathStub({ value: `${projectRoot}/packages` }),
        entries: packageDirNames.map((name) => buildDirDirent({ name })),
      });
    },

    setupPackage: ({
      packageRoot,
      srcDirNames = [],
      adapterDirNames = [],
      packageJsonContent = '{}',
    }: {
      packageRoot: string;
      srcDirNames?: readonly string[];
      adapterDirNames?: readonly string[];
      packageJsonContent?: string;
    }): void => {
      readdirProxy.setupDirectory({
        dirPath: AbsoluteFilePathStub({ value: `${packageRoot}/src` }),
        entries: srcDirNames.map((name) => buildDirDirent({ name })),
      });
      readdirProxy.setupDirectory({
        dirPath: AbsoluteFilePathStub({ value: `${packageRoot}/src/adapters` }),
        entries: adapterDirNames.map((name) => buildDirDirent({ name })),
      });
      // Exact-path address (not .setupImplementation's low-specificity catch-all) — every
      // package's package.json shares the one underlying readFileSync mock, so an
      // .setupImplementation call here would silently override every other package's
      // registration the moment a second package is staged in the same test.
      readFileProxy.setupReturns({
        filePath: AbsoluteFilePathStub({ value: `${packageRoot}/package.json` }),
        content: ContentTextStub({ value: packageJsonContent }),
      });
    },
  };
};
