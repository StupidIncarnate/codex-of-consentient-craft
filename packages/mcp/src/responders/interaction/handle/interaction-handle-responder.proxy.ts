/**
 * PURPOSE: Test setup helper for interaction handle responder
 *
 * USAGE:
 * const proxy = InteractionHandleResponderProxy();
 * const result = proxy.callResponder({ tool: ToolNameStub({ value: 'signal-back' }), args: { signal: 'complete' } });
 */

import type { AgentPromptResult } from '@dungeonmaster/shared/contracts';
import { AdapterResultStub } from '@dungeonmaster/shared/contracts';

import { askUserQuestionBrokerProxy } from '../../../brokers/ask/user-question/ask-user-question-broker.proxy';
import { signalBackBrokerProxy } from '../../../brokers/signal/back/signal-back-broker.proxy';
import { orchestratorGetAgentPromptAdapterProxy } from '../../../adapters/orchestrator/get-agent-prompt/orchestrator-get-agent-prompt-adapter.proxy';
import { orchestratorHandleSignalBackAdapterProxy } from '../../../adapters/orchestrator/handle-signal-back/orchestrator-handle-signal-back-adapter.proxy';
import { InteractionHandleResponder } from './interaction-handle-responder';
import type { QuestId } from '@dungeonmaster/shared/contracts';

export const InteractionHandleResponderProxy = (): {
  callResponder: typeof InteractionHandleResponder;
  setupAgentPromptReturns: (params: {
    agent: string;
    questId: QuestId;
    result: AgentPromptResult;
  }) => void;
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
    getLastAgentPromptCallArgs: (): unknown => agentPromptProxy.getLastCallArgs(),
  };
};
