import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
import { questWorkItemInsertBrokerProxy } from '../work-item-insert/quest-work-item-insert-broker.proxy';
import { spawnWardLayerBrokerProxy } from './spawn-ward-layer-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const runWardLayerBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
} => {
  questGetBrokerProxy();
  questModifyBrokerProxy();
  questWorkItemInsertBrokerProxy();
  spawnWardLayerBrokerProxy();

  return {
    setupQuestFound: (): void => {
      // Minimal setup — ward test is export-only
    },
  };
};
