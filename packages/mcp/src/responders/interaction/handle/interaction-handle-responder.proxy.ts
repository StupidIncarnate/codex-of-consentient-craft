/**
 * PURPOSE: Test setup helper for interaction handle responder
 *
 * USAGE:
 * const proxy = InteractionHandleResponderProxy();
 * const result = proxy.callResponder({ tool: ToolNameStub({ value: 'signal-back' }), args: { signal: 'complete' } });
 */

import type { AgentPromptResult } from '@dungeonmaster/shared/contracts';

import { signalBackBrokerProxy } from '../../../brokers/signal/back/signal-back-broker.proxy';
import { orchestratorGetAgentPromptAdapterProxy } from '../../../adapters/orchestrator/get-agent-prompt/orchestrator-get-agent-prompt-adapter.proxy';
import { orchestratorHandleSignalBackAdapterProxy } from '../../../adapters/orchestrator/handle-signal-back/orchestrator-handle-signal-back-adapter.proxy';
import { orchestratorModifyQuestAdapterProxy } from '../../../adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter.proxy';
import { InteractionHandleResponder } from './interaction-handle-responder';
import { ResolveSubagentIdentityLayerResponderProxy } from './resolve-subagent-identity-layer-responder.proxy';

export const InteractionHandleResponderProxy = (): {
  callResponder: typeof InteractionHandleResponder;
  setupAgentPromptReturns: (params: { result: AgentPromptResult }) => void;
  setupParentSession: (params: {
    homedir: string;
    cwd: string;
    sessionEntries: readonly { name: string; mtimeMs: number }[];
  }) => void;
  setupSubagentMatch: (params: {
    files: readonly string[];
    matchFilename: string;
    matchFirstLine: string;
  }) => void;
  setupSubagentDirMissing: () => void;
  setupRegisteredMonitorSession: (params: { sessionId: string; projectDir: string }) => void;
  setupToolUseIdMatch: (params: {
    files: readonly string[];
    matchFilename: string;
    matchMetaContents: string;
  }) => void;
  getLastModifyQuestInput: () => unknown;
} => {
  signalBackBrokerProxy();
  const agentPromptProxy = orchestratorGetAgentPromptAdapterProxy();
  orchestratorHandleSignalBackAdapterProxy();
  const modifyProxy = orchestratorModifyQuestAdapterProxy();
  const layerProxy = ResolveSubagentIdentityLayerResponderProxy();
  // Tests that don't opt into `setupParentSession` get the underlying fs mock's default
  // empty-array readdir response — that resolves the parent session to `undefined`, which
  // short-circuits the fallback stamp path in the layer responder. The toolUseId path is
  // gated on `meta` AND a registered monitor session — by default monitor-session returns
  // null, so tests that don't opt into `setupRegisteredMonitorSession` skip that path.

  return {
    callResponder: InteractionHandleResponder,
    setupAgentPromptReturns: ({ result }: { result: AgentPromptResult }): void => {
      agentPromptProxy.returns({ result });
    },
    setupParentSession: layerProxy.setupParentSession,
    setupSubagentMatch: layerProxy.setupSubagentMatch,
    setupSubagentDirMissing: layerProxy.setupSubagentDirMissing,
    setupRegisteredMonitorSession: layerProxy.setupRegisteredMonitorSession,
    setupToolUseIdMatch: layerProxy.setupToolUseIdMatch,
    getLastModifyQuestInput: (): unknown => modifyProxy.getLastCalledInput(),
  };
};
