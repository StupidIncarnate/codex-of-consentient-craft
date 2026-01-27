import { slotManagerOrchestrateBrokerProxy } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker.proxy';

export const lawbringerPhaseLayerBrokerProxy = (): {
  slotManagerProxy: ReturnType<typeof slotManagerOrchestrateBrokerProxy>;
} => {
  const slotManagerProxy = slotManagerOrchestrateBrokerProxy();

  return {
    slotManagerProxy,
  };
};
