import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';
import { slotManagerOrchestrateBrokerProxy } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker.proxy';

export const runCodeweaverLayerBrokerProxy = (): Record<PropertyKey, never> => {
  questLoadBrokerProxy();
  slotManagerOrchestrateBrokerProxy();

  return {};
};
