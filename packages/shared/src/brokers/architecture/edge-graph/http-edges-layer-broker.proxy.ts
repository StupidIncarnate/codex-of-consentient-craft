import { listTsFilesLayerBrokerProxy } from './list-ts-files-layer-broker.proxy';
import { readFileLayerBrokerProxy } from './read-file-layer-broker.proxy';
import { resolvePackageGroupsLayerBrokerProxy } from './resolve-package-groups-layer-broker.proxy';
import { resolveStaticsFirstMatchLayerBrokerProxy } from './resolve-statics-first-match-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const httpEdgesLayerBrokerProxy = (): {
  setup: ({
    serverStaticsSource,
    webStaticsSource,
    flowFiles,
    brokerFiles,
    httpBackendPackageNames,
    frontendPackageNames,
  }: {
    serverStaticsSource: ContentText;
    webStaticsSource: ContentText;
    flowFiles: { path: AbsoluteFilePath; source: ContentText }[];
    brokerFiles: { path: AbsoluteFilePath; source: ContentText }[];
    httpBackendPackageNames?: string[];
    frontendPackageNames?: string[];
  }) => void;
} => {
  const listFilesProxy = listTsFilesLayerBrokerProxy();
  const readFileProxy = readFileLayerBrokerProxy();
  const packageGroupsProxy = resolvePackageGroupsLayerBrokerProxy();
  resolveStaticsFirstMatchLayerBrokerProxy();

  return {
    setup: ({
      serverStaticsSource,
      webStaticsSource,
      flowFiles,
      brokerFiles,
      httpBackendPackageNames = ['server'],
      frontendPackageNames = ['web'],
    }: {
      serverStaticsSource: ContentText;
      webStaticsSource: ContentText;
      flowFiles: { path: AbsoluteFilePath; source: ContentText }[];
      brokerFiles: { path: AbsoluteFilePath; source: ContentText }[];
      httpBackendPackageNames?: string[];
      frontendPackageNames?: string[];
    }): void => {
      // Low-specificity catch-all: derives every intermediate directory (flows/, brokers/, and
      // deeper) from the given flow/broker file paths. The package-signal entries staged below —
      // each addressed by an exact dirPath/filePath — win over it per path regardless of
      // registration order, so no tree-merging is needed here.
      const allFilePaths = [...flowFiles.map((f) => f.path), ...brokerFiles.map((b) => b.path)];
      listFilesProxy.setupVirtualTree({ filePaths: allFilePaths });

      const packageNames = [...new Set([...httpBackendPackageNames, ...frontendPackageNames])];
      packageGroupsProxy.setupPackagesDir({ projectRoot: '/repo', packageDirNames: packageNames });

      for (const name of httpBackendPackageNames) {
        packageGroupsProxy.setupPackage({
          packageRoot: `/repo/packages/${name}`,
          adapterDirNames: ['hono'],
        });
        readFileProxy.setupReturns({
          filePath: AbsoluteFilePathStub({
            value: `/repo/packages/${name}/src/statics/api-routes/api-routes-statics.ts`,
          }),
          content: serverStaticsSource,
        });
      }

      for (const name of frontendPackageNames) {
        packageGroupsProxy.setupPackage({
          packageRoot: `/repo/packages/${name}`,
          srcDirNames: ['widgets'],
          packageJsonContent: JSON.stringify({ dependencies: { react: '18.2.0' } }),
        });
        readFileProxy.setupReturns({
          filePath: AbsoluteFilePathStub({
            value: `/repo/packages/${name}/src/statics/web-config/web-config-statics.ts`,
          }),
          content: webStaticsSource,
        });
      }

      for (const f of flowFiles) {
        readFileProxy.setupReturns({ filePath: f.path, content: f.source });
      }
      for (const b of brokerFiles) {
        readFileProxy.setupReturns({ filePath: b.path, content: b.source });
      }
    },
  };
};
