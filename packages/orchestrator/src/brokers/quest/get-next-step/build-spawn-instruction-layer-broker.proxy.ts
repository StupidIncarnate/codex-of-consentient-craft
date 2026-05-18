import { buildTaskPromptLayerBrokerProxy } from './build-task-prompt-layer-broker.proxy';

export const buildSpawnInstructionLayerBrokerProxy = (): Record<PropertyKey, never> => {
  buildTaskPromptLayerBrokerProxy();
  return {};
};
