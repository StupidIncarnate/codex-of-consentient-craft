/**
 * PURPOSE: Test setup helper for interaction handle responder
 *
 * USAGE:
 * const proxy = InteractionHandleResponderProxy();
 * const result = proxy.callResponder({ tool: ToolNameStub({ value: 'signal-back' }), args: { signal: 'complete' } });
 */

import type { AgentPromptResult } from '@dungeonmaster/shared/contracts';

import { askUserQuestionBrokerProxy } from '../../../brokers/ask/user-question/ask-user-question-broker.proxy';
import { signalBackBrokerProxy } from '../../../brokers/signal/back/signal-back-broker.proxy';
import { orchestratorGetAgentPromptAdapterProxy } from '../../../adapters/orchestrator/get-agent-prompt/orchestrator-get-agent-prompt-adapter.proxy';
import { orchestratorHandleSignalBackAdapterProxy } from '../../../adapters/orchestrator/handle-signal-back/orchestrator-handle-signal-back-adapter.proxy';
import { orchestratorModifyQuestAdapterProxy } from '../../../adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter.proxy';
import { InteractionHandleResponder } from './interaction-handle-responder';
import { ResolveSubagentIdentityLayerResponderProxy } from './resolve-subagent-identity-layer-responder.proxy';

export const InteractionHandleResponderProxy = (): {
  callResponder: typeof InteractionHandleResponder;
  setupAgentPromptReturns: (params: { result: AgentPromptResult }) => void;
  setupCwd: (params: { path: string }) => void;
  setupHomeDir: (params: { path: string }) => void;
  enqueueSessionsDir: (params: { entries: readonly string[] }) => void;
  enqueueSessionsDirMissing: () => void;
  enqueueSubagentsDir: (params: { entries: readonly string[] }) => void;
  enqueueSubagentsDirMissing: () => void;
  enqueueMetaFileContents: (params: { contents: string }) => void;
  getLastModifyQuestInput: () => unknown;
} => {
  askUserQuestionBrokerProxy();
  signalBackBrokerProxy();
  const agentPromptProxy = orchestratorGetAgentPromptAdapterProxy();
  orchestratorHandleSignalBackAdapterProxy();
  const modifyProxy = orchestratorModifyQuestAdapterProxy();
  const layerProxy = ResolveSubagentIdentityLayerResponderProxy();

  return {
    callResponder: InteractionHandleResponder,
    setupAgentPromptReturns: ({ result }: { result: AgentPromptResult }): void => {
      agentPromptProxy.returns({ result });
    },
    setupCwd: layerProxy.setupCwd,
    setupHomeDir: layerProxy.setupHomeDir,
    enqueueSessionsDir: layerProxy.enqueueSessionsDir,
    enqueueSessionsDirMissing: layerProxy.enqueueSessionsDirMissing,
    enqueueSubagentsDir: layerProxy.enqueueSubagentsDir,
    enqueueSubagentsDirMissing: layerProxy.enqueueSubagentsDirMissing,
    enqueueMetaFileContents: layerProxy.enqueueMetaFileContents,
    getLastModifyQuestInput: (): unknown => modifyProxy.getLastCalledInput(),
  };
};
