import type { Dirent } from 'fs';
import { architecturePackageTypeDetectBrokerProxy } from '../package-type-detect/architecture-package-type-detect-broker.proxy';
import { packageSectionBuildLayerBrokerProxy } from './package-section-build-layer-broker.proxy';
import { edgesFooterRenderLayerBrokerProxy } from './edges-footer-render-layer-broker.proxy';
import { pointerFooterRenderLayerBrokerProxy } from './pointer-footer-render-layer-broker.proxy';
import { discoverPackagesLayerBrokerProxy } from './discover-packages-layer-broker.proxy';

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
 * All sub-proxies share the same underlying `readdirSync` and `readFileSync` mock handles
 * via registerMock's stack-based dispatch. When multiple sub-proxies call setupImplementation,
 * each one overwrites the shared baseImpl. The LAST setup call wins.
 *
 * Setup ordering rule: call proxy setups that install readdir/readFile implementations
 * (edgesFooterProxy, sectionProxy) BEFORE typeDetectProxy.setupPackage so that the
 * type-detect routing implementation is the last one set and governs the type-detection pass.
 */
export const architectureProjectMapBrokerProxy = (): {
  setupLibraryPackage: ({ packageName }: { packageName: string }) => void;
  setupFrontendInkPackage: ({ packageName }: { packageName: string }) => void;
  setupEmptyMonorepo: () => void;
} => {
  const discoverProxy = discoverPackagesLayerBrokerProxy();
  const typeDetectProxy = architecturePackageTypeDetectBrokerProxy();
  const sectionProxy = packageSectionBuildLayerBrokerProxy();
  const edgesFooterProxy = edgesFooterRenderLayerBrokerProxy();
  pointerFooterRenderLayerBrokerProxy();

  return {
    setupLibraryPackage: ({ packageName }: { packageName: string }): void => {
      discoverProxy.setupPackages({
        entries: [makeDirent({ name: packageName, isDir: true })],
      });
      // edgesFooterProxy and sectionProxy must come before typeDetectProxy so that the
      // type-detect readdir routing is set last and wins for the type-detection pass.
      edgesFooterProxy.setupEmpty();
      sectionProxy.setupLibraryPackage();
      typeDetectProxy.setupPackage({
        packageRoot: `/project/packages/${packageName}`,
        packageJsonContent: '{"exports":{".":{"import":"./dist/index.js"}}}',
        srcDirNames: [],
        adapterDirNames: [],
      });
    },

    setupFrontendInkPackage: ({ packageName }: { packageName: string }): void => {
      // Only type-detect and discover setup is needed here. The section build calls
      // architectureBootTreeBroker (non-library path) then headlineDispatchLayerBroker which
      // throws immediately for frontend-ink — no further brokers (side-channel, edges-footer)
      // are reached, so their setups are not required.
      // typeDetectProxy.setupPackage must come before discoverProxy.setupPackages (which only
      // queues a ReturnValueOnce) to avoid queue ordering issues.
      typeDetectProxy.setupPackage({
        packageRoot: `/project/packages/${packageName}`,
        packageJsonContent: '{}',
        srcDirNames: ['widgets', 'adapters'],
        adapterDirNames: ['ink'],
      });
      discoverProxy.setupPackages({
        entries: [makeDirent({ name: packageName, isDir: true })],
      });
    },

    setupEmptyMonorepo: (): void => {
      edgesFooterProxy.setupEmpty();
      sectionProxy.setupLibraryPackage();
      typeDetectProxy.setupPackage({
        packageRoot: '/project',
        packageJsonContent: '{}',
        srcDirNames: [],
        adapterDirNames: [],
      });
      discoverProxy.setupMissingPackagesDir();
    },
  };
};
