/**
 * PURPOSE: Test setup helper for interaction handle responder
 *
 * USAGE:
 * const proxy = InteractionHandleResponderProxy();
 * const result = proxy.callResponder({ tool: ToolNameStub({ value: 'signal-back' }), args: { signal: 'complete' } });
 */

import type { AgentPromptResult } from '@dungeonmaster/shared/contracts';
import { AdapterResultStub, ModifyQuestResultStub } from '@dungeonmaster/shared/contracts';

import { askUserQuestionBrokerProxy } from '../../../brokers/ask/user-question/ask-user-question-broker.proxy';
import { signalBackBrokerProxy } from '../../../brokers/signal/back/signal-back-broker.proxy';
import { orchestratorGetAgentPromptAdapterProxy } from '../../../adapters/orchestrator/get-agent-prompt/orchestrator-get-agent-prompt-adapter.proxy';
import { orchestratorHandleSignalBackAdapterProxy } from '../../../adapters/orchestrator/handle-signal-back/orchestrator-handle-signal-back-adapter.proxy';
import { orchestratorMinionInformationAdapterProxy } from '../../../adapters/orchestrator/minion-information/orchestrator-minion-information-adapter.proxy';
import { orchestratorModifyQuestAdapterProxy } from '../../../adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter.proxy';
import { InteractionHandleResponder } from './interaction-handle-responder';
import { ResolveSubagentIdentityLayerResponderProxy } from './resolve-subagent-identity-layer-responder.proxy';
import type { QuestId } from '@dungeonmaster/shared/contracts';

export const InteractionHandleResponderProxy = (): {
  callResponder: typeof InteractionHandleResponder;
  setupAgentPromptReturns: (params: {
    agent: string;
    questId: QuestId;
    result: AgentPromptResult;
  }) => void;
  setupCwd: (params: { path: string }) => void;
  setupSessionsDir: (params: {
    homedir: string;
    projectDir: string;
    sessionIds: readonly string[];
  }) => void;
  setupSessionsDirMissing: (params: { homedir: string; projectDir: string }) => void;
  setupSubagentsDir: (params: {
    homedir: string;
    projectDir: string;
    sessionId: string;
    agentFilenames: readonly string[];
  }) => void;
  setupAgentFile: (params: {
    homedir: string;
    projectDir: string;
    sessionId: string;
    agentFilename: string;
    contents: string;
  }) => void;
  getLastModifyQuestInput: (params: { questId: QuestId }) => unknown;
  getLastAgentPromptCallArgs: () => unknown;
} => {
  askUserQuestionBrokerProxy();
  signalBackBrokerProxy();
  const agentPromptProxy = orchestratorGetAgentPromptAdapterProxy();
  const signalBackAdapterProxy = orchestratorHandleSignalBackAdapterProxy();
  // The signal-back tool call awaits this but never reads its result, and the questId/workItemId
  // it will be called with vary per test — this proxy has no per-test address to key on, so it
  // stages an explicit wildcard resolve rather than leaving the call unstaged.
  signalBackAdapterProxy.resolves({ result: AdapterResultStub() });
  const modifyProxy = orchestratorModifyQuestAdapterProxy();
  // Same story for the get-agent-prompt work-item stamp: the questId varies per test and the
  // stamp's result is never read, so this stages an explicit wildcard resolve too.
  modifyProxy.returns({ result: ModifyQuestResultStub() });
  const layerProxy = ResolveSubagentIdentityLayerResponderProxy();
  // Nothing to stage: the information adapter reads three literal statics and mocking them would
  // assert against a fixture rather than the text the tool really serves. Declared so the
  // enforce-proxy-child-creation rule sees every child of this responder.
  orchestratorMinionInformationAdapterProxy();

  return {
    callResponder: InteractionHandleResponder,
    setupAgentPromptReturns: ({
      agent,
      questId,
      result,
    }: {
      agent: string;
      questId: QuestId;
      result: AgentPromptResult;
    }): void => {
      agentPromptProxy.returns({ agent, questId, result });
    },
    setupCwd: layerProxy.setupCwd,
    setupSessionsDir: layerProxy.setupSessionsDir,
    setupSessionsDirMissing: layerProxy.setupSessionsDirMissing,
    setupSubagentsDir: layerProxy.setupSubagentsDir,
    setupAgentFile: layerProxy.setupAgentFile,
    getLastModifyQuestInput: ({ questId }: { questId: QuestId }): unknown =>
      modifyProxy.getLastCalledInputFor({ questId }),
    getLastAgentPromptCallArgs: (): unknown => agentPromptProxy.getLastCallArgs(),
  };
};
