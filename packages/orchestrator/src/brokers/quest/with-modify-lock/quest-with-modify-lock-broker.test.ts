import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questWithModifyLockBroker } from './quest-with-modify-lock-broker';
import { questWithModifyLockBrokerProxy } from './quest-with-modify-lock-broker.proxy';

describe('questWithModifyLockBroker', () => {
  describe('serialization of same questId', () => {
    it('VALID: {two concurrent calls on same questId} => run serially in start order', async () => {
      const proxy = questWithModifyLockBrokerProxy();
      proxy.setupEmpty();
      const questId = QuestIdStub({ value: 'quest-serial' });
      const events: ReturnType<typeof QuestIdStub>[] = [];

      const first = questWithModifyLockBroker({
        questId,
        run: async () => {
          events.push(QuestIdStub({ value: 'first-start' }));
          await new Promise<void>((resolve) => {
            setTimeout(resolve, 10);
          });
          events.push(QuestIdStub({ value: 'first-end' }));
          return QuestIdStub({ value: 'first-result' });
        },
      });

      const second = questWithModifyLockBroker({
        questId,
        run: async () => {
          events.push(QuestIdStub({ value: 'second-start' }));
          events.push(QuestIdStub({ value: 'second-end' }));
          return Promise.resolve(QuestIdStub({ value: 'second-result' }));
        },
      });

      await Promise.all([first, second]);

      expect(events).toStrictEqual([
        QuestIdStub({ value: 'first-start' }),
        QuestIdStub({ value: 'first-end' }),
        QuestIdStub({ value: 'second-start' }),
        QuestIdStub({ value: 'second-end' }),
      ]);
    });
  });

  describe('concurrency across different questIds', () => {
    it('VALID: {two concurrent calls on different questIds} => run concurrently (interleaved)', async () => {
      const proxy = questWithModifyLockBrokerProxy();
      proxy.setupEmpty();
      const questIdA = QuestIdStub({ value: 'quest-a' });
      const questIdB = QuestIdStub({ value: 'quest-b' });
      const events: ReturnType<typeof QuestIdStub>[] = [];

      const first = questWithModifyLockBroker({
        questId: questIdA,
        run: async () => {
          events.push(QuestIdStub({ value: 'a-start' }));
          await new Promise<void>((resolve) => {
            setTimeout(resolve, 20);
          });
          events.push(QuestIdStub({ value: 'a-end' }));
          return QuestIdStub({ value: 'a-result' });
        },
      });

      const second = questWithModifyLockBroker({
        questId: questIdB,
        run: async () => {
          events.push(QuestIdStub({ value: 'b-start' }));
          events.push(QuestIdStub({ value: 'b-end' }));
          return Promise.resolve(QuestIdStub({ value: 'b-result' }));
        },
      });

      await Promise.all([first, second]);

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
      const proxy = questWithModifyLockBrokerProxy();
      proxy.setupEmpty();
      const questId = QuestIdStub({ value: 'quest-reject' });
      const events: ReturnType<typeof QuestIdStub>[] = [];

      const first = questWithModifyLockBroker({
        questId,
        run: async () => Promise.reject(new Error('first-failed')),
      });

      const second = questWithModifyLockBroker({
        questId,
        run: async () => {
          events.push(QuestIdStub({ value: 'second-ran' }));
          return Promise.resolve(QuestIdStub({ value: 'second-result' }));
        },
      });

      await expect(first).rejects.toThrow(/first-failed/u);
      await expect(second).resolves.toStrictEqual(QuestIdStub({ value: 'second-result' }));

      expect(events).toStrictEqual([QuestIdStub({ value: 'second-ran' })]);
    });
  });

  describe('return value', () => {
    it('VALID: {run returns value} => resolves to that value', async () => {
      const proxy = questWithModifyLockBrokerProxy();
      proxy.setupEmpty();
      const questId = QuestIdStub({ value: 'quest-return' });

      const result = await questWithModifyLockBroker({
        questId,
        run: async () => Promise.resolve(QuestIdStub({ value: 'the-value' })),
      });

      expect(result).toStrictEqual(QuestIdStub({ value: 'the-value' }));
    });
  });
});
