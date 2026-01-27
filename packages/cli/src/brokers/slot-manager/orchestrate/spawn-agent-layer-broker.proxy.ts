import { agentSpawnByRoleBrokerProxy } from '../../agent/spawn-by-role/agent-spawn-by-role-broker.proxy';

export const spawnAgentLayerBrokerProxy = (): {
  agentSpawnByRoleProxy: ReturnType<typeof agentSpawnByRoleBrokerProxy>;
} => {
  const agentSpawnByRoleProxy = agentSpawnByRoleBrokerProxy();

  return {
    agentSpawnByRoleProxy,
  };
};
