import { ProcessIdStub } from '@dungeonmaster/shared/contracts';
import type { ProcessId } from '@dungeonmaster/shared/contracts';

import { createPollHandlerLayerBrokerProxy } from './create-poll-handler-layer-broker.proxy';
import { loadQuestByIdLayerBrokerProxy } from './load-quest-by-id-layer-broker.proxy';

type QuestModifiedHandler = (event: {
  processId: ProcessId;
  payload: { questId?: unknown };
}) => void;

export const smoketestPollQuestUntilTerminalBrokerProxy = (): ReturnType<
  typeof loadQuestByIdLayerBrokerProxy
> & {
  subscribe: (handler: QuestModifiedHandler) => void;
  unsubscribe: (handler: QuestModifiedHandler) => void;
  emitQuestModified: (payload: { questId?: unknown }) => void;
} => {
  // Both child brokers tail back to the same fs/quest-find stack, so we
  // create one underlying proxy and also instantiate the layer broker's proxy
  // to satisfy the proxy-child-creation rule for that import.
  const loadProxy = loadQuestByIdLayerBrokerProxy();
  createPollHandlerLayerBrokerProxy();
  const handlers: QuestModifiedHandler[] = [];

  return {
    ...loadProxy,
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
      const emittedProcessId = ProcessIdStub({ value: 'proxy-emitted' });
      for (const h of snapshot) {
        h({ processId: emittedProcessId, payload });
      }
    },
  };
};
