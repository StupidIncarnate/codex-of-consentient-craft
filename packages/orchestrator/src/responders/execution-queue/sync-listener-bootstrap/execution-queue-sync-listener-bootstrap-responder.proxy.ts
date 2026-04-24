import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { questOutboxWatchBrokerProxy } from '../../../brokers/quest/outbox-watch/quest-outbox-watch-broker.proxy';
import { questQueueSyncListenerBrokerProxy } from '../../../brokers/quest/queue-sync-listener/quest-queue-sync-listener-broker.proxy';
import { questExecutionQueueStateProxy } from '../../../state/quest-execution-queue/quest-execution-queue-state.proxy';

export const ExecutionQueueSyncListenerBootstrapResponderProxy = (): {
  reset: () => void;
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
  };
};
