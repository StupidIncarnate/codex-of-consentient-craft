import { FilePathStub } from '@dungeonmaster/shared/contracts';
import type { QuestQueueEntryStub } from '@dungeonmaster/shared/contracts';

import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { questOutboxWatchBrokerProxy } from '../../../brokers/quest/outbox-watch/quest-outbox-watch-broker.proxy';
import { questQueueSyncListenerBrokerProxy } from '../../../brokers/quest/queue-sync-listener/quest-queue-sync-listener-broker.proxy';
import { questExecutionQueueStateProxy } from '../../../state/quest-execution-queue/quest-execution-queue-state.proxy';

type QueueEntry = ReturnType<typeof QuestQueueEntryStub>;

export const ExecutionQueueSyncListenerBootstrapResponderProxy = (): {
  reset: () => void;
  // The outbox line a real questOutboxWatchBroker install would tail — see
  // questOutboxWatchBrokerProxy.setupLines/triggerChange.
  setupLines: (params: { lines: readonly string[] }) => void;
  triggerChange: () => void;
  getAllQueueEntries: () => readonly QueueEntry[];
  // processSyncEventLayerBroker is mocked two layers down (createSyncHandlerLayerBrokerProxy);
  // these prove the real install wiring dispatches it with the right shape once the outbox line
  // lands, without driving that layer's own real fs/state chain (its own test owns that).
  setupProcessSucceeds: () => void;
  getProcessCallArgs: () => readonly unknown[][];
} => {
  const listenerProxy = questQueueSyncListenerBrokerProxy();
  const getProxy = questGetBrokerProxy();
  const outboxProxy = questOutboxWatchBrokerProxy();
  const queueProxy = questExecutionQueueStateProxy();

  return {
    reset: (): void => {
      listenerProxy.reset();
      getProxy.setupEmptyFolder();
      outboxProxy.setupOutboxPath({
        homeDir: '/tmp/sync-listener-test',
        homePath: FilePathStub({ value: '/tmp/sync-listener-test' }),
        outboxPath: FilePathStub({ value: '/tmp/sync-listener-test/event-outbox.jsonl' }),
      });
      queueProxy.setupEmpty();
    },
    setupLines: ({ lines }: { lines: readonly string[] }): void => {
      outboxProxy.setupLines({ lines });
    },
    triggerChange: (): void => {
      outboxProxy.triggerChange();
    },
    getAllQueueEntries: (): readonly QueueEntry[] => queueProxy.getAllEntries(),
    setupProcessSucceeds: (): void => {
      listenerProxy.setupProcessSucceeds();
    },
    getProcessCallArgs: (): readonly unknown[][] => listenerProxy.getProcessCallArgs(),
  };
};
