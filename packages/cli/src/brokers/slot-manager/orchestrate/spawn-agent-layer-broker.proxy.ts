import { agentSpawnStreamingBrokerProxy } from '../../agent/spawn-streaming/agent-spawn-streaming-broker.proxy';

export const spawnAgentLayerBrokerProxy = (): {
  agentSpawnProxy: ReturnType<typeof agentSpawnStreamingBrokerProxy>;
} => {
  const agentSpawnProxy = agentSpawnStreamingBrokerProxy();

  return {
    agentSpawnProxy,
  };
};
