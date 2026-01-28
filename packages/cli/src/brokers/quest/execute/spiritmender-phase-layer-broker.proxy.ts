import { slotManagerOrchestrateBrokerProxy } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker.proxy';

export const spiritmenderPhaseLayerBrokerProxy = (): {
  setupQuestFile: (params: { questJson: string }) => void;
} => {
  const slotManagerProxy = slotManagerOrchestrateBrokerProxy();

  return {
    setupQuestFile: ({ questJson }: { questJson: string }): void => {
      slotManagerProxy.setupQuestLoad({ questJson });
    },
  };
};
