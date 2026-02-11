import { slotManagerOrchestrateBrokerProxy } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker.proxy';

export const codeweaverPhaseLayerBrokerProxy = (): {
  setupQuestLoad: (params: { questJson: string }) => void;
  setupQuestLoadError: (params: { error: Error }) => void;
} => {
  const slotManagerProxy = slotManagerOrchestrateBrokerProxy();

  return {
    setupQuestLoad: ({ questJson }: { questJson: string }): void => {
      slotManagerProxy.setupQuestLoad({ questJson });
    },
    setupQuestLoadError: ({ error }: { error: Error }): void => {
      slotManagerProxy.setupQuestLoadError({ error });
    },
  };
};
