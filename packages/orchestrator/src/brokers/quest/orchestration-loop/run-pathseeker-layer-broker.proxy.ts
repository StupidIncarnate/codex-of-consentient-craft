import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
import { questVerifyBrokerProxy } from '../verify/quest-verify-broker.proxy';
import { agentSpawnByRoleBrokerProxy } from '../../agent/spawn-by-role/agent-spawn-by-role-broker.proxy';

export const runPathseekerLayerBrokerProxy = (): Record<PropertyKey, never> => {
  questModifyBrokerProxy();
  questVerifyBrokerProxy();
  agentSpawnByRoleBrokerProxy();

  return {};
};
