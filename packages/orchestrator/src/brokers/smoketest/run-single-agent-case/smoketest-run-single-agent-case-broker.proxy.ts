import { claudeLineNormalizeBrokerProxy } from '@dungeonmaster/shared/testing';

import { agentSpawnByRoleBrokerProxy } from '../../agent/spawn-by-role/agent-spawn-by-role-broker.proxy';

export const smoketestRunSingleAgentCaseBrokerProxy = (): ReturnType<
  typeof agentSpawnByRoleBrokerProxy
> => {
  claudeLineNormalizeBrokerProxy();
  const spawnByRoleProxy = agentSpawnByRoleBrokerProxy();
  return { ...spawnByRoleProxy };
};
