/**
 * PURPOSE: Test setup helper for interaction handle responder
 *
 * USAGE:
 * const proxy = InteractionHandleResponderProxy();
 * const result = proxy.callResponder({ tool: ToolNameStub({ value: 'signal-back' }), args: { signal: 'complete' } });
 */

import type { AgentPromptResult, Quest } from '@dungeonmaster/shared/contracts';
import type { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { StartOrchestratorProxy } from '@dungeonmaster/orchestrator/startup/start-orchestrator.proxy';

import { askUserQuestionBrokerProxy } from '../../../brokers/ask/user-question/ask-user-question-broker.proxy';
import { signalBackBrokerProxy } from '../../../brokers/signal/back/signal-back-broker.proxy';
import { InteractionHandleResponder } from './interaction-handle-responder';

// Derived from the real StartOrchestrator method signature (never hand-typed) so the elements
// getAgentPromptGetCalls() hands back can be read by field without an ad-hoc structural cast.
type GetAgentPromptParams = Parameters<typeof StartOrchestrator.getAgentPrompt>[0];

export const InteractionHandleResponderProxy = (): {
  callResponder: typeof InteractionHandleResponder;
  setupAgentPromptReturns: (params: {
    agent: string;
    questId: Quest['id'];
    result: AgentPromptResult;
  }) => void;
  getLastAgentPromptCallArgs: () => unknown;
} => {
  askUserQuestionBrokerProxy();
  signalBackBrokerProxy();
  const orchestratorProxy = StartOrchestratorProxy();
  // The signal-back tool call awaits this but never reads its result, and the questId/workItemId
  // it will be called with vary per test — this proxy has no per-test address to key on, so it
  // stages an explicit wildcard resolve rather than leaving the call unstaged.
  orchestratorProxy.handleSignalBackResolves({});

  return {
    callResponder: InteractionHandleResponder,
    setupAgentPromptReturns: ({
      agent,
      questId,
      result,
    }: {
      agent: string;
      questId: Quest['id'];
      result: AgentPromptResult;
    }): void => {
      orchestratorProxy.getAgentPromptReturns({ agent, questId, result });
    },
    // The SAME getAgentPromptGetCalls() read, here with no address, so a test can pull the whole
    // forwarded object off the single call it made — including proving a key is ABSENT.
    getLastAgentPromptCallArgs: (): unknown => {
      const calls = orchestratorProxy.getAgentPromptGetCalls() as GetAgentPromptParams[];
      return calls.at(-1);
    },
  };
};
