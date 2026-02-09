import { agentSpawnByRoleBrokerProxy } from '../../agent/spawn-by-role/agent-spawn-by-role-broker.proxy';

export const spawnAgentLayerBrokerProxy = (): Record<PropertyKey, never> => {
  agentSpawnByRoleBrokerProxy();
  return {};
};
