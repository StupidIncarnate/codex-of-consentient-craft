import type { Dirent } from 'fs';
import { architecturePackageTypeDetectBrokerProxy } from '../package-type-detect/architecture-package-type-detect-broker.proxy';
import { packageSectionBuildLayerBrokerProxy } from './package-section-build-layer-broker.proxy';
import { pointerFooterRenderLayerBrokerProxy } from './pointer-footer-render-layer-broker.proxy';
import { discoverPackagesLayerBrokerProxy } from './discover-packages-layer-broker.proxy';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { projectMapStatics } from '../../../statics/project-map/project-map-statics';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

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

/**
 * All sub-proxies share the same underlying `readdirSync` and `readFileSync` staging — one
 * function, one behaviour. Each sub-proxy's setupImplementation describes those calls at the
 * same specificity, and at equal specificity the most recently staged description wins.
 *
 * Setup ordering rule: call proxy setups that install readdir/readFile implementations
 * (sectionProxy) BEFORE typeDetectProxy.setupPackage so that the type-detect routing
 * implementation is the last one set and governs the type-detection pass.
 */
export const architectureProjectMapBrokerProxy = (): {
  setupLibraryPackage: ({
    projectRoot,
    packageName,
  }: {
    projectRoot: AbsoluteFilePath;
    packageName: string;
  }) => void;
  setupRenderablePackage: ({
    projectRoot,
    packageName,
  }: {
    projectRoot: AbsoluteFilePath;
    packageName: string;
  }) => void;
  setupFrontendInkPackage: ({
    projectRoot,
    packageName,
  }: {
    projectRoot: AbsoluteFilePath;
    packageName: string;
  }) => void;
  setupEmptyMonorepo: ({ projectRoot }: { projectRoot: AbsoluteFilePath }) => void;
} => {
  const discoverProxy = discoverPackagesLayerBrokerProxy();
  const typeDetectProxy = architecturePackageTypeDetectBrokerProxy();
  packageSectionBuildLayerBrokerProxy();
  pointerFooterRenderLayerBrokerProxy();

  return {
    setupLibraryPackage: ({
      projectRoot,
      packageName,
    }: {
      projectRoot: AbsoluteFilePath;
      packageName: string;
    }): void => {
      // Library packages are filtered out before reaching package-section-build, so this
      // setup just configures discovery + type-detection to identify the package as a library.
      discoverProxy.setupPackages({
        dirPath: AbsoluteFilePathStub({
          value: `${String(projectRoot)}/${projectMapStatics.packagesDirName}`,
        }),
        entries: [makeDirent({ name: packageName, isDir: true })],
      });
      typeDetectProxy.setupPackage({
        packageRoot: `/project/packages/${packageName}`,
        packageJsonContent: '{"exports":{".":{"import":"./dist/index.js"}}}',
        srcDirNames: [],
        adapterDirNames: [],
      });
    },

    setupRenderablePackage: ({
      projectRoot,
      packageName,
    }: {
      projectRoot: AbsoluteFilePath;
      packageName: string;
    }): void => {
      // Configures a package whose type-detect returns 'programmatic-service' so the package
      // section IS rendered (with a `# name [type]` header). Used by tests that consume the
      // header line (e.g. session-snippet-packages).
      discoverProxy.setupPackages({
        dirPath: AbsoluteFilePathStub({
          value: `${String(projectRoot)}/${projectMapStatics.packagesDirName}`,
        }),
        entries: [makeDirent({ name: packageName, isDir: true })],
      });
      typeDetectProxy.setupPackage({
        packageRoot: `/project/packages/${packageName}`,
        packageJsonContent: '{}',
        srcDirNames: ['flows', 'responders', 'state', 'startup'],
        adapterDirNames: [],
        startupFileName: 'start-app.ts',
        startupFileContent: ContentTextStub({
          value: 'export const StartApp = { run: async () => {} };',
        }),
      });
    },

    setupFrontendInkPackage: ({
      projectRoot,
      packageName,
    }: {
      projectRoot: AbsoluteFilePath;
      packageName: string;
    }): void => {
      typeDetectProxy.setupPackage({
        packageRoot: `/project/packages/${packageName}`,
        packageJsonContent: '{}',
        srcDirNames: ['widgets', 'adapters'],
        adapterDirNames: ['ink'],
      });
      discoverProxy.setupPackages({
        dirPath: AbsoluteFilePathStub({
          value: `${String(projectRoot)}/${projectMapStatics.packagesDirName}`,
        }),
        entries: [makeDirent({ name: packageName, isDir: true })],
      });
    },

    setupEmptyMonorepo: ({ projectRoot }: { projectRoot: AbsoluteFilePath }): void => {
      typeDetectProxy.setupPackage({
        packageRoot: '/project',
        packageJsonContent: '{}',
        srcDirNames: [],
        adapterDirNames: [],
      });
      discoverProxy.setupMissingPackagesDir({
        dirPath: AbsoluteFilePathStub({
          value: `${String(projectRoot)}/${projectMapStatics.packagesDirName}`,
        }),
      });
    },
  };
};
