import { clearIntervalProxy } from '#gateway/node/clearInterval/clear-interval/clear-interval.proxy';
import { setIntervalProxy } from '#gateway/node/setInterval/set-interval/set-interval.proxy';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import { createDriverHandlerLayerBrokerProxy } from './create-driver-handler-layer-broker.proxy';
import { createDriverPollTickLayerBrokerProxy } from './create-driver-poll-tick-layer-broker.proxy';
import { smoketestSweepPendingWorkItemsLayerBrokerProxy } from './smoketest-sweep-pending-work-items-layer-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

type QuestModifiedHandler = (event: {
  processId: string;
  payload: { questId?: unknown };
}) => void;

export const smoketestScenarioDriverBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: (params: { questId: string }) => void;
  getAllPersistedContents: () => readonly unknown[];
  subscribe: (handler: QuestModifiedHandler) => void;
  unsubscribe: (handler: QuestModifiedHandler) => void;
  emitQuestModified: (payload: { questId?: unknown }) => void;
  isHandlerSubscribed: () => boolean;
} => {
  // Both pass through: the driver's poll runs on a real timer, which each test's stop call clears.
  setIntervalProxy();
  clearIntervalProxy();
  // The scenario driver directly imports BOTH the event-handler layer broker and the sweep layer
  // broker. Register both child proxies so enforce-proxy-child-creation is satisfied. The handler
  // layer delegates to the sweep layer internally, so both proxies share the same nested
  // smoketestStampOverrideBrokerProxy chain — setupQuestFound must seed the stamp proxy enough
  // times to satisfy BOTH an initial sweep AND a subsequent event-driven sweep.
  createDriverHandlerLayerBrokerProxy();
  createDriverPollTickLayerBrokerProxy();
  const sweepProxy = smoketestSweepPendingWorkItemsLayerBrokerProxy();
  const handlers: QuestModifiedHandler[] = [];

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      // Seed the mock queue enough times to cover: (1) the initial sweep on construction and
      // (2) any subsequent event-handler sweeps emitted by the test. Each sweep call needs a
      // fresh quest-found seed since the stamp proxy's path/load/persist chain queues consume
      // sequentially.
      sweepProxy.setupQuestFound({ quest });
      sweepProxy.setupQuestFound({ quest });
      sweepProxy.setupQuestFound({ quest });
      sweepProxy.setupQuestFound({ quest });
    },
    setupQuestNotFound: ({ questId }: { questId: string }): void => {
      sweepProxy.setupQuestNotFound({ questId });
    },
    getAllPersistedContents: (): readonly unknown[] => sweepProxy.getAllPersistedContents(),
    subscribe: (handler: QuestModifiedHandler): void => {
      handlers.push(handler);
    },
    unsubscribe: (handler: QuestModifiedHandler): void => {
      const index = handlers.indexOf(handler);
      if (index >= 0) {
        handlers.splice(index, 1);
      }
    },
    emitQuestModified: (payload: { questId?: unknown }): void => {
      const snapshot = handlers.slice();
      const emittedProcessId = 'driver-proxy-emitted';
      for (const h of snapshot) {
        h({ processId: emittedProcessId, payload });
      }
    },
    isHandlerSubscribed: (): boolean => handlers.length > 0,
  };
};
