import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';
import { slotManagerOrchestrateBrokerProxy } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker.proxy';

export const runLawbringerLayerBrokerProxy = (): Record<PropertyKey, never> => {
  questLoadBrokerProxy();
  slotManagerOrchestrateBrokerProxy();

  return {};
};
