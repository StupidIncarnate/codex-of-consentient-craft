import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { smoketestSweepPendingWorkItemsLayerBrokerProxy } from './smoketest-sweep-pending-work-items-layer-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const createDriverHandlerLayerBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  getAllPersistedContents: () => readonly unknown[];
} => {
  const sweepProxy = smoketestSweepPendingWorkItemsLayerBrokerProxy();

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      sweepProxy.setupQuestFound({ quest });
    },
    setupQuestNotFound: (): void => {
      sweepProxy.setupQuestNotFound();
    },
    getAllPersistedContents: (): readonly unknown[] => sweepProxy.getAllPersistedContents(),
  };
};
