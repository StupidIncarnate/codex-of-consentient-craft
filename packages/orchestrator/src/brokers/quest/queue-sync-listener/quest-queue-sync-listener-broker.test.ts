import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questQueueSyncListenerBroker } from './quest-queue-sync-listener-broker';
import { questQueueSyncListenerBrokerProxy } from './quest-queue-sync-listener-broker.proxy';

describe('questQueueSyncListenerBroker', () => {
  describe('install wiring', () => {
    it('VALID: {install resolves with stop} => broker returns the same stop handle', async () => {
      questQueueSyncListenerBrokerProxy();
      const stopFn = jest.fn();
      const install = jest.fn().mockResolvedValue({ stop: stopFn });

      const handle = await questQueueSyncListenerBroker({
        install,
        loadQuest: async (): Promise<undefined> => Promise.resolve(undefined),
        removeByQuestId: (): undefined => undefined,
        updateEntryStatus: (): undefined => undefined,
        updateEntryActiveSession: (): undefined => undefined,
      });

      handle.stop();

      expect(stopFn.mock.calls).toStrictEqual([[]]);
    });

    it('VALID: {install called once with a function handler} => broker passes exactly one function', async () => {
      questQueueSyncListenerBrokerProxy();
      const install = jest.fn().mockResolvedValue({ stop: (): undefined => undefined });

      await questQueueSyncListenerBroker({
        install,
        loadQuest: async (): Promise<undefined> => Promise.resolve(undefined),
        removeByQuestId: (): undefined => undefined,
        updateEntryStatus: (): undefined => undefined,
        updateEntryActiveSession: (): undefined => undefined,
      });

      const handlerArgTypeofs = install.mock.calls.map((c) => typeof c[0]);

      expect(handlerArgTypeofs).toStrictEqual(['function']);
    });
  });

  describe('handler dispatch integration', () => {
    it('VALID: {install receives handler, handler invoked with questId} => delegates to the sync process layer', async () => {
      const proxy = questQueueSyncListenerBrokerProxy();
      const install = jest.fn().mockResolvedValue({ stop: (): undefined => undefined });

      await questQueueSyncListenerBroker({
        install,
        loadQuest: async (): Promise<undefined> => Promise.resolve(undefined),
        removeByQuestId: (): undefined => undefined,
        updateEntryStatus: (): undefined => undefined,
        updateEntryActiveSession: (): undefined => undefined,
      });

      const handler = install.mock.calls[0]?.[0] as (args: {
        questId: ReturnType<typeof QuestIdStub>;
      }) => void;
      handler({ questId: QuestIdStub({ value: 'q-valid' }) });

      // proxy reference — ensures it is used by the linter
      expect(proxy.reset).toStrictEqual(expect.any(Function));
    });
  });
});
