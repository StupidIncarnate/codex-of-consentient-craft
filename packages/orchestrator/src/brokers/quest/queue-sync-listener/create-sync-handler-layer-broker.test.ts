import { QuestIdStub, QuestStatusStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { createSyncHandlerLayerBroker } from './create-sync-handler-layer-broker';
import { createSyncHandlerLayerBrokerProxy } from './create-sync-handler-layer-broker.proxy';

describe('createSyncHandlerLayerBroker', () => {
  describe('handler factory', () => {
    it('VALID: {factory call} => returns a callable handler accepting ({questId})', () => {
      createSyncHandlerLayerBrokerProxy();

      const handler = createSyncHandlerLayerBroker({
        loadQuest: async (): Promise<undefined> => Promise.resolve(undefined),
        removeByQuestId: (): undefined => undefined,
        updateEntryStatus: (): undefined => undefined,
        updateEntryActiveSession: (): undefined => undefined,
      });

      const handlerArity = handler.length;

      expect(handlerArity).toBe(1);
    });
  });

  describe('handler dispatch', () => {
    it('VALID: {handler invoked with a questId} => dispatches processSyncEventLayerBroker once with correct args', () => {
      const proxy = createSyncHandlerLayerBrokerProxy();
      proxy.setupProcessSucceeds();
      const loadQuest = jest
        .fn()
        .mockResolvedValue(QuestStub({ status: QuestStatusStub({ value: 'abandoned' }) }));
      const removeByQuestId = jest.fn();
      const updateEntryStatus = jest.fn();
      const updateEntryActiveSession = jest.fn();

      const handler = createSyncHandlerLayerBroker({
        loadQuest,
        removeByQuestId,
        updateEntryStatus,
        updateEntryActiveSession,
      });
      const questId = QuestIdStub({ value: 'q-dispatch' });

      handler({ questId });

      const calls = proxy.getProcessCallArgs();
      const argShapes = calls.map((c) => c[0]);

      expect(argShapes).toStrictEqual([
        {
          questId,
          loadQuest,
          removeByQuestId,
          updateEntryStatus,
          updateEntryActiveSession,
        },
      ]);
    });

    it('VALID: {dispatched processSyncEventLayerBroker rejects} => handler swallows rejection, logs to stderr', async () => {
      const proxy = createSyncHandlerLayerBrokerProxy();
      proxy.setupProcessRejects({ error: new Error('boom') });
      const stderrCapture = proxy.silenceStderrAndCaptureLogs();
      const loadQuest = jest.fn();
      const removeByQuestId = jest.fn();
      const updateEntryStatus = jest.fn();
      const updateEntryActiveSession = jest.fn();

      const handler = createSyncHandlerLayerBroker({
        loadQuest,
        removeByQuestId,
        updateEntryStatus,
        updateEntryActiveSession,
      });

      handler({ questId: QuestIdStub({ value: 'q-rejects' }) });

      // Allow microtasks to flush so the .catch fires.
      await Promise.resolve();
      await Promise.resolve();

      expect(stderrCapture.wroteRejectionLog()).toBe(true);
    });
  });
});
