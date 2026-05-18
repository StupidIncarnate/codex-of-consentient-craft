import { agentPromptGetBrokerProxy } from '../../agent-prompt/get/agent-prompt-get-broker.proxy';
import { questGetBrokerProxy } from '../../quest/get/quest-get-broker.proxy';
import { questGetNextStepBrokerProxy } from '../../quest/get-next-step/quest-get-next-step-broker.proxy';
import { questModifyBrokerProxy } from '../../quest/modify/quest-modify-broker.proxy';
import { questPostWalkHookBrokerProxy } from '../../quest/post-walk-hook/quest-post-walk-hook-broker.proxy';

/**
 * Proxy for smoketestInProcessDriverBroker.
 *
 * The driver composes several brokers (agentPromptGetBroker, questGetBroker, questModifyBroker,
 * questPostWalkHookBroker, questGetNextStepBroker). Test coverage is light here because the broker
 * is mostly orchestration — the integration test in smoketest-flow exercises the full path against
 * a real hydrated quest. We instantiate the composing proxies so registerMock chains stay wired.
 */
export const smoketestInProcessDriverBrokerProxy = (): Record<PropertyKey, never> => {
  agentPromptGetBrokerProxy();
  questGetBrokerProxy();
  questModifyBrokerProxy();
  questPostWalkHookBrokerProxy();
  questGetNextStepBrokerProxy();
  return {};
};
