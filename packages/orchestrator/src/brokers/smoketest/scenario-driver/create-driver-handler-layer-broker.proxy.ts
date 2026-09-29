import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import { smoketestSweepPendingWorkItemsLayerBrokerProxy } from './smoketest-sweep-pending-work-items-layer-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const createDriverHandlerLayerBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: (params: { questId: string }) => void;
  getAllPersistedContents: () => readonly unknown[];
} => {
  const sweepProxy = smoketestSweepPendingWorkItemsLayerBrokerProxy();
  stderrProxy();

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      sweepProxy.setupQuestFound({ quest });
    },
    setupQuestNotFound: ({ questId }: { questId: string }): void => {
      sweepProxy.setupQuestNotFound({ questId });
    },
    getAllPersistedContents: (): readonly unknown[] => sweepProxy.getAllPersistedContents(),
  };
};
