/**
 * PURPOSE: Test setup helper for interaction handle responder
 *
 * USAGE:
 * const proxy = InteractionHandleResponderProxy();
 * const result = proxy.callResponder({ tool: ToolNameStub({ value: 'signal-back' }), args: { signal: 'complete' } });
 */

import { signalBackBrokerProxy } from '../../../brokers/signal/back/signal-back-broker.proxy';
import { askUserQuestionBrokerProxy } from '../../../brokers/ask/user-question/ask-user-question-broker.proxy';
import { orchestratorGetAgentPromptAdapterProxy } from '../../../adapters/orchestrator/get-agent-prompt/orchestrator-get-agent-prompt-adapter.proxy';
import type { AgentPromptResult } from '../../../contracts/agent-prompt-result/agent-prompt-result-contract';
import { InteractionHandleResponder } from './interaction-handle-responder';

export const InteractionHandleResponderProxy = (): {
  callResponder: typeof InteractionHandleResponder;
  setupAgentPromptReturns: (params: { result: AgentPromptResult }) => void;
} => {
  signalBackBrokerProxy();
  askUserQuestionBrokerProxy();
  const agentPromptProxy = orchestratorGetAgentPromptAdapterProxy();

  return {
    callResponder: InteractionHandleResponder,
    setupAgentPromptReturns: ({ result }: { result: AgentPromptResult }): void => {
      agentPromptProxy.returns({ result });
    },
  };
};
