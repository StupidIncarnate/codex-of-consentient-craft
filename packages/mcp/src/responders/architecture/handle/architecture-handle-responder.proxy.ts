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
  processCwdAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import type {
  FileContents,
  FolderType,
  GlobPattern,
  PathSegment,
} from '@dungeonmaster/shared/contracts';
import { ContentTextStub } from '../../../contracts/content-text/content-text.stub';
import { mcpDiscoverBrokerProxy } from '../../../brokers/mcp/discover/mcp-discover-broker.proxy';
import { architectureFolderDetailBrokerProxy } from '../../../brokers/architecture/folder-detail/architecture-folder-detail-broker.proxy';
import { architectureSyntaxRulesBrokerProxy } from '../../../brokers/architecture/syntax-rules/architecture-syntax-rules-broker.proxy';
import { architectureTestingPatternsBrokerProxy } from '../../../brokers/architecture/testing-patterns/architecture-testing-patterns-broker.proxy';
import { folderConstraintsStateProxy } from '../../../state/folder-constraints/folder-constraints-state.proxy';
import { folderConstraintsState } from '../../../state/folder-constraints/folder-constraints-state';
import { ArchitectureHandleResponder } from './architecture-handle-responder';

// The responder's get-project-map branch resolves projectRoot from processCwdAdapter(), which
// this proxy leaves unstaged — the shared proxy's sticky default ('/default/cwd') is therefore
// the real value every project-map call below is keyed on, not a placeholder.
const DEFAULT_PROJECT_ROOT = AbsoluteFilePathStub({ value: '/default/cwd' });

export const ArchitectureHandleResponderProxy = (): {
  callResponder: typeof ArchitectureHandleResponder;
  setupFileDiscovery: (params: {
    filepath: PathSegment;
    contents: FileContents;
    pattern: GlobPattern;
  }) => void;
  setupFolderConstraint: (params: { folderType: string; content: string }) => void;
  setupLibraryPackage: (params: { packageName: string }) => void;
  setupFrontendInkPackage: (params: { packageName: string }) => void;
  setupEmptyMonorepo: () => void;
} => {
  processCwdAdapterProxy();
  architectureOverviewBrokerProxy();
  architecturePackageInventoryBrokerProxy();
  const projectMapProxy = architectureProjectMapBrokerProxy();
  const discoverProxy = mcpDiscoverBrokerProxy();
  architectureFolderDetailBrokerProxy();
  architectureSyntaxRulesBrokerProxy();
  architectureTestingPatternsBrokerProxy();
  const stateProxy = folderConstraintsStateProxy();
  stateProxy.setupClear();

  return {
    callResponder: ArchitectureHandleResponder,
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
  };
};
