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

export const ArchitectureHandleResponderProxy = (): {
  callResponder: typeof ArchitectureHandleResponder;
  setupFileDiscovery: (params: {
    filepath: PathSegment;
    contents: FileContents;
    pattern: GlobPattern;
  }) => void;
  setupFolderConstraint: (params: { folderType: string; content: string }) => void;
  setupLibraryPackage: ReturnType<typeof architectureProjectMapBrokerProxy>['setupLibraryPackage'];
  setupFrontendInkPackage: ReturnType<
    typeof architectureProjectMapBrokerProxy
  >['setupFrontendInkPackage'];
  setupEmptyMonorepo: ReturnType<typeof architectureProjectMapBrokerProxy>['setupEmptyMonorepo'];
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
    setupLibraryPackage: ({
      packageName,
    }: Parameters<
      ReturnType<typeof architectureProjectMapBrokerProxy>['setupLibraryPackage']
    >[0]): void => {
      projectMapProxy.setupLibraryPackage({ packageName });
    },
    setupFrontendInkPackage: ({
      packageName,
    }: Parameters<
      ReturnType<typeof architectureProjectMapBrokerProxy>['setupFrontendInkPackage']
    >[0]): void => {
      projectMapProxy.setupFrontendInkPackage({ packageName });
    },
    setupEmptyMonorepo: (): void => {
      projectMapProxy.setupEmptyMonorepo();
    },
  };
};
