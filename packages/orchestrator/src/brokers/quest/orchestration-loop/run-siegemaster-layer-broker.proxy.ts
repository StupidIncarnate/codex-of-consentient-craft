import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';
import { slotManagerOrchestrateBrokerProxy } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker.proxy';

export const runSiegemasterLayerBrokerProxy = (): {
  setupQuestLoad: (params: { questJson: string }) => void;
  setupQuestLoadError: (params: { error: Error }) => void;
} => {
  const questLoadProxy = questLoadBrokerProxy();
  slotManagerOrchestrateBrokerProxy();

  return {
    setupQuestLoad: ({ questJson }: { questJson: string }): void => {
      questLoadProxy.setupQuestFile({ questJson });
    },
    setupQuestLoadError: ({ error }: { error: Error }): void => {
      questLoadProxy.setupQuestFileReadError({ error });
    },
  };
};
