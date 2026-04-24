import { ProcessIdStub, QuestIdStub, QuestStatusStub } from '@dungeonmaster/shared/contracts';

import { createSyncHandlerLayerBroker } from './create-sync-handler-layer-broker';
import { createSyncHandlerLayerBrokerProxy } from './create-sync-handler-layer-broker.proxy';

describe('createSyncHandlerLayerBroker', () => {
  describe('handler factory', () => {
    it('VALID: {factory call} => returns a callable handler accepting (event)', () => {
      createSyncHandlerLayerBrokerProxy();

      const handler = createSyncHandlerLayerBroker({
        loadQuestStatus: async (): Promise<undefined> => Promise.resolve(undefined),
        removeByQuestId: (): undefined => undefined,
        updateEntryStatus: (): undefined => undefined,
      });

      const handlerArity = handler.length;

      expect(handlerArity).toBe(1);
    });
  });

  describe('handler dispatch', () => {
    it('EMPTY: {payload.questId is a number, not a string} => no dispatch', () => {
      const proxy = createSyncHandlerLayerBrokerProxy();
      const loadQuestStatus = jest.fn();
      const removeByQuestId = jest.fn();
      const updateEntryStatus = jest.fn();

      const handler = createSyncHandlerLayerBroker({
        loadQuestStatus,
        removeByQuestId,
        updateEntryStatus,
      });

      handler({
        processId: ProcessIdStub({ value: 'proc-bad-payload' }),
        payload: { questId: 99 },
      });

      expect(proxy.getProcessCallArgs()).toStrictEqual([]);
    });

    it('EMPTY: {payload.questId omitted entirely} => no dispatch', () => {
      const proxy = createSyncHandlerLayerBrokerProxy();
      const loadQuestStatus = jest.fn();
      const removeByQuestId = jest.fn();
      const updateEntryStatus = jest.fn();

      const handler = createSyncHandlerLayerBroker({
        loadQuestStatus,
        removeByQuestId,
        updateEntryStatus,
      });

      handler({
        processId: ProcessIdStub({ value: 'proc-no-questid' }),
        payload: {},
      });

      expect(proxy.getProcessCallArgs()).toStrictEqual([]);
    });

    it('VALID: {payload.questId is a string} => dispatches processSyncEventLayerBroker once with correct args', () => {
      const proxy = createSyncHandlerLayerBrokerProxy();
      proxy.setupProcessSucceeds();
      const loadQuestStatus = jest.fn().mockResolvedValue(QuestStatusStub({ value: 'abandoned' }));
      const removeByQuestId = jest.fn();
      const updateEntryStatus = jest.fn();

      const handler = createSyncHandlerLayerBroker({
        loadQuestStatus,
        removeByQuestId,
        updateEntryStatus,
      });
      const questId = QuestIdStub({ value: 'q-dispatch' });

      handler({
        processId: ProcessIdStub({ value: 'proc-dispatch' }),
        payload: { questId },
      });

      const calls = proxy.getProcessCallArgs();
      const argShapes = calls.map((c) => c[0]);

      expect(argShapes).toStrictEqual([
        {
          questId,
          loadQuestStatus,
          removeByQuestId,
          updateEntryStatus,
        },
      ]);
    });

    it('VALID: {dispatched processSyncEventLayerBroker rejects} => handler swallows rejection, logs to stderr', async () => {
      const proxy = createSyncHandlerLayerBrokerProxy();
      proxy.setupProcessRejects({ error: new Error('boom') });
      const stderrCapture = proxy.silenceStderrAndCaptureLogs();
      const loadQuestStatus = jest.fn();
      const removeByQuestId = jest.fn();
      const updateEntryStatus = jest.fn();

      const handler = createSyncHandlerLayerBroker({
        loadQuestStatus,
        removeByQuestId,
        updateEntryStatus,
      });

      handler({
        processId: ProcessIdStub({ value: 'proc-rejects' }),
        payload: { questId: QuestIdStub({ value: 'q-rejects' }) },
      });

      // Allow microtasks to flush so the .catch fires.
      await Promise.resolve();
      await Promise.resolve();

      expect(stderrCapture.wroteRejectionLog()).toBe(true);
    });
  });
});
