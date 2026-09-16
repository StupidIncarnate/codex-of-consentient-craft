/**
 * PURPOSE: Test setup helper for architecture handle responder
 *
 * USAGE:
 * const proxy = ArchitectureHandleResponderProxy();
 * const result = await proxy.callResponder({ tool: ToolNameStub({ value: 'get-architecture' }), args: {} });
 */

import {
  architectureOverviewBrokerProxy,
  architecturePackageInventoryBrokerProxy,
  architectureProjectMapBrokerProxy,
} from '@dungeonmaster/shared/testing';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import type {
  FileContents,
  FolderType,
  GlobPattern,
  PathSegment,
} from '@dungeonmaster/shared/contracts';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import type { ToolName } from '../../../contracts/tool-name/tool-name-contract';
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
const DEFAULT_PROJECT_ROOT = AbsoluteFilePathStub({ value: '/default/cwd' });

export const ArchitectureHandleResponderProxy = (): {
  callResponder: (params: {
    tool: ToolName;
    args: Record<string, unknown>;
    meta?: Record<string, unknown>;
  }) => ReturnType<typeof ArchitectureHandleResponder>;
  setupFileDiscovery: (params: {
    filepath: PathSegment;
    contents: FileContents;
    pattern: GlobPattern;
  }) => void;
  setupDiscoverIgnore: (params: { patterns: readonly GlobPattern[] }) => void;
  setupFolderConstraint: (params: { folderType: string; content: string }) => void;
  setupLibraryPackage: (params: { packageName: string }) => void;
  setupFrontendInkPackage: (params: { packageName: string }) => void;
  setupEmptyMonorepo: () => void;
  setupCallerCwdRoot: (params: {
    toolUseId: string;
    homedir: string;
    sessionId: string;
    repoRoot: string;
  }) => void;
} => {
  const repoRootProxy = ResolveCallerRepoRootLayerResponderProxy();
  repoRootProxy.setupServerCwd({ cwd: '/default/cwd' });
  repoRootProxy.setupRepoRootAtStart({ startPath: '/default/cwd' });

  architectureOverviewBrokerProxy();
  architecturePackageInventoryBrokerProxy();
  const projectMapProxy = architectureProjectMapBrokerProxy();
  const discoverProxy = mcpDiscoverBrokerProxy();
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
    setupDiscoverIgnore: ({ patterns }: { patterns: readonly GlobPattern[] }): void => {
      discoverIgnoreState.set({ patterns });
    },
    setupFileDiscovery: ({
      filepath,
      contents,
      pattern,
    }: {
      filepath: PathSegment;
      contents: FileContents;
      pattern: GlobPattern;
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
        folderType: folderType as FolderType,
        content: ContentTextStub({ value: content }),
      });
    },
    setupLibraryPackage: ({ packageName }: { packageName: string }): void => {
      projectMapProxy.setupLibraryPackage({ projectRoot: DEFAULT_PROJECT_ROOT, packageName });
    },
    setupFrontendInkPackage: ({ packageName }: { packageName: string }): void => {
      projectMapProxy.setupFrontendInkPackage({ projectRoot: DEFAULT_PROJECT_ROOT, packageName });
    },
    setupEmptyMonorepo: (): void => {
      projectMapProxy.setupEmptyMonorepo({ projectRoot: DEFAULT_PROJECT_ROOT });
    },
    setupCallerCwdRoot: ({
      toolUseId,
      homedir,
      sessionId,
      repoRoot,
    }: {
      toolUseId: string;
      homedir: string;
      sessionId: string;
      repoRoot: string;
    }): void => {
      repoRootProxy.setupColdMatch({
        serverCwd: '/default/cwd',
        homedir,
        sessionId,
        toolUseId,
        callerCwd: repoRoot,
      });
      repoRootProxy.setupRepoRootAtStart({ startPath: repoRoot });
    },
  };
};
