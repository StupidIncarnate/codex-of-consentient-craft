import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { questFindQuestPathBrokerProxy } from '../../quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../../quest/load/quest-load-broker.proxy';
import { smoketestStampOverrideBrokerProxy } from '../stamp-override/smoketest-stamp-override-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const smoketestSweepPendingWorkItemsLayerBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  getAllPersistedContents: () => readonly unknown[];
} => {
  // Register child proxies for every implementation import even though the stampProxy already
  // registers its own nested chain — the enforce-proxy-child-creation rule requires each direct
  // implementation import to have a matching proxy import at this layer.
  questFindQuestPathBrokerProxy();
  questLoadBrokerProxy();
  pathJoinAdapterProxy();
  const stampProxy = smoketestStampOverrideBrokerProxy();

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      // Sweep performs its own quest-find + quest-load before delegating to stampOverrideBroker
      // which repeats both. Seed the proxy twice so all four underlying calls succeed.
      stampProxy.setupQuestFound({ quest });
      stampProxy.setupQuestFound({ quest });
    },
    setupQuestNotFound: (): void => {
      stampProxy.setupQuestNotFound();
    },
    getAllPersistedContents: (): readonly unknown[] => stampProxy.getAllPersistedContents(),
  };
};
