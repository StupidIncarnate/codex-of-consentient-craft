import { architecturePackageTypeDetectBrokerProxy } from '../package-type-detect/architecture-package-type-detect-broker.proxy';
import { architectureGatewayInventoryBrokerProxy } from '../gateway-inventory/architecture-gateway-inventory-broker.proxy';
import { packageSectionBuildLayerBrokerProxy } from './package-section-build-layer-broker.proxy';
import { pointerFooterRenderLayerBrokerProxy } from './pointer-footer-render-layer-broker.proxy';
import { discoverPackagesLayerBrokerProxy } from './discover-packages-layer-broker.proxy';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { projectMapStatics } from '../../../statics/project-map/project-map-statics';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

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
  setupGatewayGroupPackage: ({
    projectRoot,
    groupName,
    packageName,
  }: {
    projectRoot: AbsoluteFilePath;
    groupName: string;
    packageName: string;
  }) => void;
  setupEmptyMonorepo: ({ projectRoot }: { projectRoot: AbsoluteFilePath }) => void;
  setupGatewaySubpath: ({
    projectRoot,
    folder,
    subpathName,
    barrelContent,
  }: {
    projectRoot: AbsoluteFilePath;
    folder: string;
    subpathName: string;
    barrelContent?: ContentText;
  }) => void;
} => {
  const discoverProxy = discoverPackagesLayerBrokerProxy();
  const typeDetectProxy = architecturePackageTypeDetectBrokerProxy();
  const gatewayInventoryProxy = architectureGatewayInventoryBrokerProxy();
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
        entries: [{ name: packageName, isDirectory: true }],
      });
      typeDetectProxy.setupPackage({
        packageRoot: `/project/packages/${packageName}`,
        packageJsonContent: '{"exports":{".":{"import":"./dist/index.js"}}}',
        srcDirNames: [],
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
        entries: [{ name: packageName, isDirectory: true }],
      });
      typeDetectProxy.setupPackage({
        packageRoot: `/project/packages/${packageName}`,
        packageJsonContent: '{}',
        srcDirNames: ['flows', 'responders', 'state', 'startup'],
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
        packageJsonContent: '{"dependencies":{"ink":"^5.0.0"}}',
        srcDirNames: ['widgets'],
      });
      discoverProxy.setupPackages({
        dirPath: AbsoluteFilePathStub({
          value: `${String(projectRoot)}/${projectMapStatics.packagesDirName}`,
        }),
        entries: [{ name: packageName, isDirectory: true }],
      });
    },

    setupGatewayGroupPackage: ({
      projectRoot,
      groupName,
      packageName,
    }: {
      projectRoot: AbsoluteFilePath;
      groupName: string;
      packageName: string;
    }): void => {
      // The group folder itself (`@gateway`) is the only top-level entry `discoverPackagesLayerBroker`
      // sees; its own second readdir call into that group is what surfaces `packageName` as a child,
      // with a relativeDir the broker builds from BOTH segments — proven at that broker's own level
      // by discover-packages-layer-broker.test.ts. This proxy stages both readdir calls so the
      // composer's OWN test can assert the resulting section uses the bare child name.
      const packagesDir = AbsoluteFilePathStub({
        value: `${String(projectRoot)}/${projectMapStatics.packagesDirName}`,
      });
      discoverProxy.setupPackages({
        dirPath: packagesDir,
        entries: [{ name: groupName, isDirectory: true }],
      });
      discoverProxy.setupGroupFolder({
        dirPath: packagesDir,
        groupName,
        entries: [{ name: packageName, isDirectory: true }],
      });
      typeDetectProxy.setupPackage({
        packageRoot: `/project/packages/${groupName}/${packageName}`,
        packageJsonContent: '{"exports":{".":{"import":"./dist/index.js"}}}',
        srcDirNames: [],
      });
    },

    setupEmptyMonorepo: ({ projectRoot }: { projectRoot: AbsoluteFilePath }): void => {
      typeDetectProxy.setupPackage({
        packageRoot: '/project',
        packageJsonContent: '{}',
        srcDirNames: [],
      });
      discoverProxy.setupMissingPackagesDir({
        dirPath: AbsoluteFilePathStub({
          value: `${String(projectRoot)}/${projectMapStatics.packagesDirName}`,
        }),
      });
    },

    setupGatewaySubpath: ({
      projectRoot,
      folder,
      subpathName,
      barrelContent,
    }: {
      projectRoot: AbsoluteFilePath;
      folder: string;
      subpathName: string;
      barrelContent?: ContentText;
    }): void => {
      gatewayInventoryProxy.setupSubpath({
        projectRoot,
        folder,
        subpathName,
        ...(barrelContent !== undefined && { barrelContent }),
      });
    },
  };
};
