/**
 * PURPOSE: Test setup helper for interaction handle responder
 *
 * USAGE:
 * const proxy = InteractionHandleResponderProxy();
 * const result = proxy.callResponder({ tool: ToolNameStub({ value: 'signal-back' }), args: { signal: 'complete' } });
 */

import type { AgentPromptResult } from '@dungeonmaster/shared/contracts';
import { AdapterResultStub, ModifyQuestResultStub } from '@dungeonmaster/shared/contracts';
import type { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';

import { askUserQuestionBrokerProxy } from '../../../brokers/ask/user-question/ask-user-question-broker.proxy';
import { signalBackBrokerProxy } from '../../../brokers/signal/back/signal-back-broker.proxy';
import { InteractionHandleResponder } from './interaction-handle-responder';
import { ResolveSubagentIdentityLayerResponderProxy } from './resolve-subagent-identity-layer-responder.proxy';
import type { QuestId } from '@dungeonmaster/shared/contracts';

// Derived from the real StartOrchestrator method signatures (never hand-typed) so the elements
// each *GetCalls() hands back can be read by field without an ad-hoc structural cast.
type ModifyQuestParams = Parameters<typeof StartOrchestrator.modifyQuest>[0];
type GetAgentPromptParams = Parameters<typeof StartOrchestrator.getAgentPrompt>[0];

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
  const orchestratorProxy = StartOrchestratorProxy();
  // The signal-back tool call awaits this but never reads its result, and the questId/workItemId
  // it will be called with vary per test — this proxy has no per-test address to key on, so it
  // stages an explicit wildcard resolve rather than leaving the call unstaged.
  orchestratorProxy.handleSignalBackResolves({ result: AdapterResultStub() });
  // Same story for the get-agent-prompt work-item stamp: the questId varies per test and the
  // stamp's result is never read, so this stages an explicit wildcard resolve too.
  orchestratorProxy.modifyQuestReturns({ result: ModifyQuestResultStub() });
  // And again for the session-cwd row the same stamp appends: the sessionId is discovered by the
  // JSONL scan rather than supplied by the test, so there is no per-test address to key on.
  orchestratorProxy.recordQuestSessionReturns({});
  const layerProxy = ResolveSubagentIdentityLayerResponderProxy();

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
      orchestratorProxy.getAgentPromptReturns({ agent, questId, result });
    },
    setupCwd: layerProxy.setupCwd,
    setupSessionsDir: layerProxy.setupSessionsDir,
    setupSessionsDirMissing: layerProxy.setupSessionsDirMissing,
    setupSubagentsDir: layerProxy.setupSubagentsDir,
    setupAgentFile: layerProxy.setupAgentFile,
    // The SAME modifyQuestGetCalls() read, filtered by questId here, so a test can pull the
    // `input` field off the one call it made without re-describing questId on the proxy itself.
    getLastModifyQuestInput: ({ questId }: { questId: QuestId }): unknown => {
      const calls = orchestratorProxy.modifyQuestGetCalls() as ModifyQuestParams[];
      return calls.filter((call) => call.questId === questId).at(-1)?.input;
    },
    // The SAME getAgentPromptGetCalls() read, here with no address, so a test can pull the whole
    // forwarded object off the single call it made — including proving a key is ABSENT.
    getLastAgentPromptCallArgs: (): unknown => {
      const calls = orchestratorProxy.getAgentPromptGetCalls() as GetAgentPromptParams[];
      return calls.at(-1);
    },
  };
};
