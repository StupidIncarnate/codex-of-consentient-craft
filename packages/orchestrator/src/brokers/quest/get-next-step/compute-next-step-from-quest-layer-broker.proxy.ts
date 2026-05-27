import { buildSpawnInstructionLayerBrokerProxy } from './build-spawn-instruction-layer-broker.proxy';
import { computeReadyWorkItemsLayerBrokerProxy } from './compute-ready-work-items-layer-broker.proxy';
import { selectBatchLayerBrokerProxy } from './select-batch-layer-broker.proxy';

export const computeNextStepFromQuestLayerBrokerProxy = (): Record<PropertyKey, never> => {
  buildSpawnInstructionLayerBrokerProxy();
  computeReadyWorkItemsLayerBrokerProxy();
  selectBatchLayerBrokerProxy();
  return {};
};
