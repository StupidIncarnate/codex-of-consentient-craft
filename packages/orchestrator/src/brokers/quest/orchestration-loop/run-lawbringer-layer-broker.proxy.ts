import { agentParallelRunnerBrokerProxy } from '../../agent/parallel-runner/agent-parallel-runner-broker.proxy';
import { agentSpawnByRoleBrokerProxy } from '../../agent/spawn-by-role/agent-spawn-by-role-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';

export const runLawbringerLayerBrokerProxy = (): Record<PropertyKey, never> => {
  questLoadBrokerProxy();
  agentSpawnByRoleBrokerProxy();
  agentParallelRunnerBrokerProxy();

  return {};
};
