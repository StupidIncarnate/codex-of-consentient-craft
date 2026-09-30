import { listTsFilesLayerBrokerProxy } from './list-ts-files-layer-broker.proxy';
import { safeReaddirLayerBrokerProxy } from './safe-readdir-layer-broker.proxy';
import { readFileLayerBrokerProxy } from './read-file-layer-broker.proxy';

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
    packageJsonContent?: string;
    flowFiles?: readonly { name: string; content: string }[];
  }) => void;
} => {
  listTsFilesLayerBrokerProxy();
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
        dirPath: `${projectRoot}/packages`,
        entries: packageDirNames.map((name) => ({ name, kind: 'directory' as const })),
      });
    },

    setupPackage: ({
      packageRoot,
      srcDirNames = [],
      packageJsonContent = '{}',
      flowFiles = [],
    }: {
      packageRoot: string;
      srcDirNames?: readonly string[];
      packageJsonContent?: string;
      flowFiles?: readonly { name: string; content: string }[];
    }): void => {
      readdirProxy.setupDirectory({
        dirPath: `${packageRoot}/src`,
        entries: srcDirNames.map((name) => ({ name, kind: 'directory' as const })),
      });
      // Staged only when a test names flow files: http-edges proxies stage `src/flows` themselves
      // after this call, and an unconditional empty listing here would be what they overwrite.
      if (flowFiles.length > 0) {
        readdirProxy.setupDirectory({
          dirPath: `${packageRoot}/src/flows`,
          entries: flowFiles.map(({ name }) => ({ name, kind: 'file' as const })),
        });
      }
      for (const { name, content } of flowFiles) {
        readFileProxy.setupReturns({
          filePath: `${packageRoot}/src/flows/${name}`,
          content,
        });
      }
      // Exact-path address (not .setupImplementation's low-specificity catch-all) — every
      // package's package.json shares the one underlying readFileSync mock, so an
      // .setupImplementation call here would silently override every other package's
      // registration the moment a second package is staged in the same test.
      readFileProxy.setupReturns({
        filePath: `${packageRoot}/package.json`,
        content: packageJsonContent,
      });
    },
  };
};
