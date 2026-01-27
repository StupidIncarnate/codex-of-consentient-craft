import { questLoadBrokerProxy } from '../../quest/load/quest-load-broker.proxy';
import { questUpdateStepBrokerProxy } from '../../quest/update-step/quest-update-step-broker.proxy';
import { handleSignalLayerBrokerProxy } from './handle-signal-layer-broker.proxy';
import { spawnAgentLayerBrokerProxy } from './spawn-agent-layer-broker.proxy';

export const orchestrationLoopLayerBrokerProxy = (): {
  questLoadProxy: ReturnType<typeof questLoadBrokerProxy>;
  questUpdateStepProxy: ReturnType<typeof questUpdateStepBrokerProxy>;
  spawnAgentProxy: ReturnType<typeof spawnAgentLayerBrokerProxy>;
  handleSignalProxy: ReturnType<typeof handleSignalLayerBrokerProxy>;
} => {
  const questLoadProxy = questLoadBrokerProxy();
  const questUpdateStepProxy = questUpdateStepBrokerProxy();
  const spawnAgentProxy = spawnAgentLayerBrokerProxy();
  const handleSignalProxy = handleSignalLayerBrokerProxy();

  jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-15T10:00:00.000Z');

  return {
    questLoadProxy,
    questUpdateStepProxy,
    spawnAgentProxy,
    handleSignalProxy,
  };
};
