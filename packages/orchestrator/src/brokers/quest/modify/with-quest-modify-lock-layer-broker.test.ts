import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { withQuestModifyLockLayerBroker } from './with-quest-modify-lock-layer-broker';
import { withQuestModifyLockLayerBrokerProxy } from './with-quest-modify-lock-layer-broker.proxy';

describe('withQuestModifyLockLayerBroker', () => {
  describe('serialization of same questId', () => {
    it('VALID: {two concurrent calls on same questId} => run serially in start order', async () => {
      const proxy = withQuestModifyLockLayerBrokerProxy();
      proxy.setupEmpty();
      const questId = QuestIdStub({ value: 'quest-serial' });
      const events: ReturnType<typeof QuestIdStub>[] = [];

      const first = withQuestModifyLockLayerBroker({
        questId,
        run: async () => {
          events.push(QuestIdStub({ value: 'first-start' }));
          await Promise.resolve();
          await Promise.resolve();
          events.push(QuestIdStub({ value: 'first-end' }));
          return QuestIdStub({ value: 'first' });
        },
      });

      const second = withQuestModifyLockLayerBroker({
        questId,
        run: async () => {
          events.push(QuestIdStub({ value: 'second-start' }));
          events.push(QuestIdStub({ value: 'second-end' }));
          return QuestIdStub({ value: 'second' });
        },
      });

      const results = await Promise.all([first, second]);

      expect(results).toStrictEqual([
        QuestIdStub({ value: 'first' }),
        QuestIdStub({ value: 'second' }),
      ]);
      expect(events).toStrictEqual([
        QuestIdStub({ value: 'first-start' }),
        QuestIdStub({ value: 'first-end' }),
        QuestIdStub({ value: 'second-start' }),
        QuestIdStub({ value: 'second-end' }),
      ]);
    });

    it('VALID: {10 concurrent calls on same questId} => execute serially, counter increments deterministically', async () => {
      const proxy = withQuestModifyLockLayerBrokerProxy();
      proxy.setupEmpty();
      const questId = QuestIdStub({ value: 'quest-counter' });
      let counter = QuestIdStub({ value: '0' });
      const observed: ReturnType<typeof QuestIdStub>[] = [];

      const calls = Array.from({ length: 10 }, (_, index) =>
        withQuestModifyLockLayerBroker({
          questId,
          run: async () => {
            const start = Number(String(counter));
            await Promise.resolve();
            counter = QuestIdStub({ value: String(start + 1) });
            observed.push(QuestIdStub({ value: String(index) }));
            return counter;
          },
        }),
      );

      const results = await Promise.all(calls);

      expect(results).toStrictEqual([
        QuestIdStub({ value: '1' }),
        QuestIdStub({ value: '2' }),
        QuestIdStub({ value: '3' }),
        QuestIdStub({ value: '4' }),
        QuestIdStub({ value: '5' }),
        QuestIdStub({ value: '6' }),
        QuestIdStub({ value: '7' }),
        QuestIdStub({ value: '8' }),
        QuestIdStub({ value: '9' }),
        QuestIdStub({ value: '10' }),
      ]);
      expect(observed).toStrictEqual([
        QuestIdStub({ value: '0' }),
        QuestIdStub({ value: '1' }),
        QuestIdStub({ value: '2' }),
        QuestIdStub({ value: '3' }),
        QuestIdStub({ value: '4' }),
        QuestIdStub({ value: '5' }),
        QuestIdStub({ value: '6' }),
        QuestIdStub({ value: '7' }),
        QuestIdStub({ value: '8' }),
        QuestIdStub({ value: '9' }),
      ]);
      expect(counter).toStrictEqual(QuestIdStub({ value: '10' }));
    });
  });

  describe('concurrency across different questIds', () => {
    it('VALID: {two concurrent calls on different questIds} => run concurrently (interleaved)', async () => {
      const proxy = withQuestModifyLockLayerBrokerProxy();
      proxy.setupEmpty();
      const questIdA = QuestIdStub({ value: 'quest-a' });
      const questIdB = QuestIdStub({ value: 'quest-b' });
      const events: ReturnType<typeof QuestIdStub>[] = [];

      const first = withQuestModifyLockLayerBroker({
        questId: questIdA,
        run: async () => {
          events.push(QuestIdStub({ value: 'a-start' }));
          await Promise.resolve();
          await Promise.resolve();
          events.push(QuestIdStub({ value: 'a-end' }));
          return QuestIdStub({ value: 'a' });
        },
      });

      const second = withQuestModifyLockLayerBroker({
        questId: questIdB,
        run: async () => {
          events.push(QuestIdStub({ value: 'b-start' }));
          await Promise.resolve();
          events.push(QuestIdStub({ value: 'b-end' }));
          return QuestIdStub({ value: 'b' });
        },
      });

      const results = await Promise.all([first, second]);

      expect(results).toStrictEqual([
        QuestIdStub({ value: 'a' }),
        QuestIdStub({ value: 'b' }),
      ]);
      expect(events).toStrictEqual([
        QuestIdStub({ value: 'a-start' }),
        QuestIdStub({ value: 'b-start' }),
        QuestIdStub({ value: 'b-end' }),
        QuestIdStub({ value: 'a-end' }),
      ]);
    });
  });

  describe('rejection does not poison the chain', () => {
    it('ERROR: {first run rejects} => second run on same questId still executes', async () => {
      const proxy = withQuestModifyLockLayerBrokerProxy();
      proxy.setupEmpty();
      const questId = QuestIdStub({ value: 'quest-reject' });
      const events: ReturnType<typeof QuestIdStub>[] = [];

      const first = withQuestModifyLockLayerBroker({
        questId,
        run: async () => {
          events.push(QuestIdStub({ value: 'first-start' }));
          throw new Error('first failed');
        },
      });

      const second = withQuestModifyLockLayerBroker({
        questId,
        run: async () => {
          events.push(QuestIdStub({ value: 'second-start' }));
          return QuestIdStub({ value: 'second' });
        },
      });

      await expect(first).rejects.toThrow(/^first failed$/u);
      await expect(second).resolves.toStrictEqual(QuestIdStub({ value: 'second' }));

      expect(events).toStrictEqual([
        QuestIdStub({ value: 'first-start' }),
        QuestIdStub({ value: 'second-start' }),
      ]);
    });
  });

  describe('return value', () => {
    it('VALID: {run returns value} => resolves to that value', async () => {
      const proxy = withQuestModifyLockLayerBrokerProxy();
      proxy.setupEmpty();
      const questId = QuestIdStub({ value: 'quest-return' });

      const result = await withQuestModifyLockLayerBroker({
        questId,
        run: async () => QuestIdStub({ value: 'the-value' }),
      });

      expect(result).toStrictEqual(QuestIdStub({ value: 'the-value' }));
    });
  });
});
