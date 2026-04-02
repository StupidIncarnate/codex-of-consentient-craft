/**
 * PURPOSE: Test setup helper for architecture handle responder
 *
 * USAGE:
 * const proxy = ArchitectureHandleResponderProxy();
 * const result = await proxy.callResponder({ tool: ToolNameStub({ value: 'get-architecture' }), args: {} });
 */

import { architectureOverviewBrokerProxy } from '@dungeonmaster/shared/testing';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';
import type { GlobPattern } from '../../../contracts/glob-pattern/glob-pattern-contract';
import type { FolderType } from '@dungeonmaster/shared/contracts';
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
    filepath: FilePath;
    contents: FileContents;
    pattern: GlobPattern;
  }) => void;
  setupFolderConstraint: (params: { folderType: string; content: string }) => void;
} => {
  architectureOverviewBrokerProxy();
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
      filepath: FilePath;
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
  };
};
