import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import type { QuestQueueEntryStub } from '@dungeonmaster/shared/contracts/quest-queue-entry/quest-queue-entry.stub';

import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { questOutboxWatchBrokerProxy } from '../../../brokers/quest/outbox-watch/quest-outbox-watch-broker.proxy';
import { questQueueSyncListenerBrokerProxy } from '../../../brokers/quest/queue-sync-listener/quest-queue-sync-listener-broker.proxy';
import { questExecutionQueueStateProxy } from '../../../state/quest-execution-queue/quest-execution-queue-state.proxy';

type QueueEntry = ReturnType<typeof QuestQueueEntryStub>;

const OUTBOX_PATH = '/tmp/sync-listener-test/event-outbox.jsonl';

export const ExecutionQueueSyncListenerBootstrapResponderProxy = (): {
  reset: () => void;
  // The outbox line a real questOutboxWatchBroker install would tail — see
  // questOutboxWatchBrokerProxy.setupLines. Staged before the install: the tail drains once as it starts.
  setupLines: (params: { lines: readonly string[] }) => void;
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
  stderrProxy();

  return {
    reset: (): void => {
      listenerProxy.reset();
      getProxy.setupEmptyFolder();
      outboxProxy.setupOutboxPath({
        homeDir: '/tmp/sync-listener-test',
        homePath: '/tmp/sync-listener-test',
        outboxPath: OUTBOX_PATH,
      });
      queueProxy.setupEmpty();
    },
    setupLines: ({ lines }: { lines: readonly string[] }): void => {
      outboxProxy.setupLines({ path: OUTBOX_PATH, lines });
    },
    getAllQueueEntries: (): readonly QueueEntry[] => queueProxy.getAllEntries(),
    setupProcessSucceeds: (): void => {
      listenerProxy.setupProcessSucceeds();
    },
    getProcessCallArgs: (): readonly unknown[][] => listenerProxy.getProcessCallArgs(),
  };
};
