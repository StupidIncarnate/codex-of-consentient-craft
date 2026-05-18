/**
 * PURPOSE: Proxy for AgentPromptGetResponder that delegates to the agent-prompt-get-broker proxy
 *
 * USAGE:
 * const proxy = AgentPromptGetResponderProxy();
 * proxy.setupQuestFound({ quest });
 */

import { agentPromptGetBrokerProxy } from '../../../brokers/agent-prompt/get/agent-prompt-get-broker.proxy';
import type { QuestStub } from '@dungeonmaster/shared/contracts';

type Quest = ReturnType<typeof QuestStub>;

export const AgentPromptGetResponderProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
} => {
  const brokerProxy = agentPromptGetBrokerProxy();

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      brokerProxy.setupQuestFound({ quest });
    },
  };
};
