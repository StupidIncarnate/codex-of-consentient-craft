import { questExecuteBrokerProxy } from '../../quest/execute/quest-execute-broker.proxy';

export const agentOrchestrateBrokerProxy = (): ReturnType<typeof questExecuteBrokerProxy> =>
  questExecuteBrokerProxy();
