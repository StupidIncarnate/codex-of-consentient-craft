/**
 * PURPOSE: Test setup helper for architecture handle responder
 *
 * USAGE:
 * const proxy = ArchitectureHandleResponderProxy();
 * const result = await proxy.callResponder({ tool: ToolNameStub({ value: 'get-architecture' }), args: {} });
 */

import { architectureOverviewBrokerProxy } from '@dungeonmaster/shared/testing';
import { mcpDiscoverBrokerProxy } from '../../../brokers/mcp/discover/mcp-discover-broker.proxy';
import { architectureFolderDetailBrokerProxy } from '../../../brokers/architecture/folder-detail/architecture-folder-detail-broker.proxy';
import { architectureSyntaxRulesBrokerProxy } from '../../../brokers/architecture/syntax-rules/architecture-syntax-rules-broker.proxy';
import { architectureTestingPatternsBrokerProxy } from '../../../brokers/architecture/testing-patterns/architecture-testing-patterns-broker.proxy';
import { folderConstraintsStateProxy } from '../../../state/folder-constraints/folder-constraints-state.proxy';
import { ArchitectureHandleResponder } from './architecture-handle-responder';

export const ArchitectureHandleResponderProxy = (): {
  callResponder: typeof ArchitectureHandleResponder;
} => {
  architectureOverviewBrokerProxy();
  mcpDiscoverBrokerProxy();
  architectureFolderDetailBrokerProxy();
  architectureSyntaxRulesBrokerProxy();
  architectureTestingPatternsBrokerProxy();
  const stateProxy = folderConstraintsStateProxy();
  stateProxy.setupClear();

  return {
    callResponder: ArchitectureHandleResponder,
  };
};
