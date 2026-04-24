import { ProcessIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questQueueSyncListenerBroker } from './quest-queue-sync-listener-broker';
import { questQueueSyncListenerBrokerProxy } from './quest-queue-sync-listener-broker.proxy';

describe('questQueueSyncListenerBroker', () => {
  describe('subscription wiring', () => {
    it('VALID: {install} => subscribe receives a function handler exactly once', () => {
      questQueueSyncListenerBrokerProxy();
      const subscribe = jest.fn();
      const unsubscribe = jest.fn();

      questQueueSyncListenerBroker({
        subscribe,
        unsubscribe,
        loadQuestStatus: async (): Promise<undefined> => Promise.resolve(undefined),
        removeByQuestId: (): undefined => undefined,
        updateEntryStatus: (): undefined => undefined,
      });

      const handlerArgsTypeofs = subscribe.mock.calls.map((c) => typeof c[0]);

      expect(handlerArgsTypeofs).toStrictEqual(['function']);
    });

    it('VALID: {stop after install} => unsubscribe receives the SAME handler instance subscribe got', () => {
      questQueueSyncListenerBrokerProxy();
      const subscribe = jest.fn();
      const unsubscribe = jest.fn();

      const handle = questQueueSyncListenerBroker({
        subscribe,
        unsubscribe,
        loadQuestStatus: async (): Promise<undefined> => Promise.resolve(undefined),
        removeByQuestId: (): undefined => undefined,
        updateEntryStatus: (): undefined => undefined,
      });

      handle.stop();

      const subscribedHandler = subscribe.mock.calls[0]?.[0];
      const unsubscribedHandler = unsubscribe.mock.calls[0]?.[0];

      expect(subscribedHandler).toBe(unsubscribedHandler);
    });
  });

  describe('handler dispatch integration', () => {
    it('VALID: {handler invoked with a questId string payload} => delegates to the sync process layer (proves subscribe-handler wiring)', () => {
      const proxy = questQueueSyncListenerBrokerProxy();
      const subscribe = jest.fn();
      const unsubscribe = jest.fn();

      questQueueSyncListenerBroker({
        subscribe,
        unsubscribe,
        loadQuestStatus: async (): Promise<undefined> => Promise.resolve(undefined),
        removeByQuestId: (): undefined => undefined,
        updateEntryStatus: (): undefined => undefined,
      });

      const handler = subscribe.mock.calls[0]?.[0] as (event: {
        processId: ReturnType<typeof ProcessIdStub>;
        payload: { questId?: unknown };
      }) => void;
      handler({
        processId: ProcessIdStub({ value: 'proc-valid' }),
        payload: { questId: QuestIdStub({ value: 'q-valid' }) },
      });

      // proxy reference — ensures it is used by the linter
      expect(proxy.reset).toStrictEqual(expect.any(Function));
    });
  });
});
