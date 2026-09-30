/**
 * PURPOSE: Test setup helper for architecture handle responder
 *
 * USAGE:
 * const proxy = ArchitectureHandleResponderProxy();
 * const result = await proxy.callResponder({ tool: ToolNameStub({ value: 'get-architecture' }), args: {} });
 */

import { architectureOverviewBrokerProxy } from '@dungeonmaster/shared/brokers/architecture/overview/architecture-overview-broker.proxy';
import { architecturePackageInventoryBrokerProxy } from '@dungeonmaster/shared/brokers/architecture/package-inventory/architecture-package-inventory-broker.proxy';
import { architectureProjectMapBrokerProxy } from '@dungeonmaster/shared/brokers/architecture/project-map/architecture-project-map-broker.proxy';
import { architectureGatewayInventoryBrokerProxy } from '@dungeonmaster/shared/brokers/architecture/gateway-inventory/architecture-gateway-inventory-broker.proxy';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import { mcpDiscoverBrokerProxy } from '../../../brokers/mcp/discover/mcp-discover-broker.proxy';
import { architectureFolderDetailBrokerProxy } from '../../../brokers/architecture/folder-detail/architecture-folder-detail-broker.proxy';
import { architectureTestingPatternsBrokerProxy } from '../../../brokers/architecture/testing-patterns/architecture-testing-patterns-broker.proxy';
import { ResolveCallerRepoRootLayerResponderProxy } from './resolve-caller-repo-root-layer-responder.proxy';
import { discoverIgnoreStateProxy } from '../../../state/discover-ignore/discover-ignore-state.proxy';
import { discoverIgnoreState } from '../../../state/discover-ignore/discover-ignore-state';
import { folderConstraintsStateProxy } from '../../../state/folder-constraints/folder-constraints-state.proxy';
import { folderConstraintsState } from '../../../state/folder-constraints/folder-constraints-state';
import { ArchitectureHandleResponder } from './architecture-handle-responder';

// The responder's get-project-map / get-project-inventory / discover branches all resolve their
// project root via ResolveCallerRepoRootLayerResponder, which (with no `meta` staged for a caller
// cwd) falls back to the server's own cwd — so this default IS what every call below is keyed on,
// not a placeholder.
const DEFAULT_PROJECT_ROOT = '/default/cwd';

export const ArchitectureHandleResponderProxy = (): {
  callResponder: (params: {
    tool: string;
    args: Record<string, unknown>;
    meta?: Record<string, unknown>;
  }) => ReturnType<typeof ArchitectureHandleResponder>;
  setupFileDiscovery: (params: {
    filepath: string;
    contents: string;
    pattern: string;
  }) => void;
  setupDiscoverIgnore: (params: { patterns: readonly string[] }) => void;
  setupFolderConstraint: (params: { folderType: string; content: string }) => void;
  setupLibraryPackage: (params: { packageName: string }) => void;
  setupFrontendInkPackage: (params: { packageName: string }) => void;
  setupGatewayGroupPackage: (params: { groupName: string; packageName: string }) => void;
  setupGatewaySubpath: (params: {
    folder: string;
    subpathName: string;
    barrelContent?: string;
  }) => void;
  setupDirectPackage: (params: { packageName: string; repoRoot?: string }) => void;
  setupEmptyMonorepo: () => void;
  setupCallerCwdRoot: (params: { repoRoot: string }) => void;
} => {
  const repoRootProxy = ResolveCallerRepoRootLayerResponderProxy();
  repoRootProxy.setupServerCwd({ cwd: '/default/cwd' });
  repoRootProxy.setupRepoRootAtStart({ startPath: '/default/cwd' });

  architectureOverviewBrokerProxy();
  architecturePackageInventoryBrokerProxy();
  const projectMapProxy = architectureProjectMapBrokerProxy();
  const gatewayInventoryProxy = architectureGatewayInventoryBrokerProxy();
  const discoverProxy = mcpDiscoverBrokerProxy();
  // Only get-project-inventory's own gateway-group resolution addresses these two directly — every
  // other branch reaches fs through architecturePackageInventoryBrokerProxy /
  // architectureProjectMapBrokerProxy above, which already registers each adapter's low-specificity
  // "not found" default (existsSync: false, readdir: []) for every unaddressed path.
  const existsSyncHandle = existsSyncProxy();
  const readdirHandle = readdirEntriesSyncProxy();

  architectureFolderDetailBrokerProxy();
  architectureTestingPatternsBrokerProxy();
  const stateProxy = folderConstraintsStateProxy();
  stateProxy.setupClear();
  // Cleared rather than seeded: the state falls back to the static ignore rules while unset, which
  // is exactly what the discover branch should scan with when a test says nothing about gitignore.
  const ignoreStateProxy = discoverIgnoreStateProxy();
  ignoreStateProxy.setupClear();

  return {
    callResponder: async ({ tool, args, meta }) =>
      ArchitectureHandleResponder({ tool, args, meta }),
    setupDiscoverIgnore: ({ patterns }: { patterns: readonly string[] }): void => {
      discoverIgnoreState.set({ patterns });
    },
    setupFileDiscovery: ({
      filepath,
      contents,
      pattern,
    }: {
      filepath: string;
      contents: string;
      pattern: string;
    }): void => {
      discoverProxy.setupFileDiscovery({ filepath, contents, pattern });
    },
    setupFolderConstraint: ({
      folderType,
      content,
    }: {
      folderType: string;
      content: string;
    }): void => {
      folderConstraintsState.set({
        folderType,
        content: content,
      });
    },
    setupLibraryPackage: ({ packageName }: { packageName: string }): void => {
      projectMapProxy.setupLibraryPackage({ projectRoot: DEFAULT_PROJECT_ROOT, packageName });
    },
    setupFrontendInkPackage: ({ packageName }: { packageName: string }): void => {
      projectMapProxy.setupFrontendInkPackage({ projectRoot: DEFAULT_PROJECT_ROOT, packageName });
    },
    // get-project-inventory looks up `packages/<packageName>` directly first, and only scans a
    // `@scope` group folder when that direct lookup misses — so a gateway package resolves this
    // proxy's fs mocks in two steps: "the direct folder isn't there" then "here's the group's
    // listing", exactly the two calls the responder itself makes.
    setupGatewayGroupPackage: ({
      groupName,
      packageName,
    }: {
      groupName: string;
      packageName: string;
    }): void => {
      const packagesPath = `${String(DEFAULT_PROJECT_ROOT)}/packages`;
      existsSyncHandle.returns({
        path: `${String(packagesPath)}/${packageName}`,
        exists: false,
      });
      readdirHandle.returns({
        path: packagesPath,
        entries: [{ name: groupName, kind: 'directory' }],
      });
      readdirHandle.returns({
        path: `${String(packagesPath)}/${groupName}`,
        entries: [{ name: packageName, kind: 'directory' }],
      });
    },
    setupGatewaySubpath: ({
      folder,
      subpathName,
      barrelContent,
    }: {
      folder: string;
      subpathName: string;
      barrelContent?: string;
    }): void => {
      gatewayInventoryProxy.setupSubpath({
        projectRoot: DEFAULT_PROJECT_ROOT,
        folder,
        subpathName,
        ...(barrelContent !== undefined && { barrelContent }),
      });
    },
    setupDirectPackage: ({
      packageName,
      repoRoot,
    }: {
      packageName: string;
      repoRoot?: string;
    }): void => {
      const root = repoRoot ?? String(DEFAULT_PROJECT_ROOT);
      existsSyncHandle.returns({
        path: `${root}/packages/${packageName}`,
        exists: true,
      });
    },
    setupEmptyMonorepo: (): void => {
      projectMapProxy.setupEmptyMonorepo({ projectRoot: DEFAULT_PROJECT_ROOT });
    },
    setupCallerCwdRoot: ({ repoRoot }: { repoRoot: string }): void => {
      repoRootProxy.setupRepoRootAtStart({ startPath: repoRoot });
    },
  };
};
