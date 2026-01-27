import { slotManagerOrchestrateBrokerProxy } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker.proxy';

export const codeweaverPhaseLayerBrokerProxy = (): {
  slotManagerProxy: ReturnType<typeof slotManagerOrchestrateBrokerProxy>;
} => {
  const slotManagerProxy = slotManagerOrchestrateBrokerProxy();

  return {
    slotManagerProxy,
  };
};
