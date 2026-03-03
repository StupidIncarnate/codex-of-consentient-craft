import { FileContentsStub, FilePathStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { questPersistBroker } from './quest-persist-broker';
import { questPersistBrokerProxy } from './quest-persist-broker.proxy';

describe('questPersistBroker', () => {
  describe('successful persist', () => {
    it('VALID: {questFilePath, contents, questId} => writes file to disk', async () => {
      const proxy = questPersistBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/add-auth/quest.json' });
      const contents = FileContentsStub({ value: '{"name":"add-auth"}' });
      const questId = QuestIdStub({ value: 'add-auth' });
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const outboxFilePath = FilePathStub({
        value: '/home/testuser/.dungeonmaster/event-outbox.jsonl',
      });

      proxy.setupPersist({ homePath, outboxFilePath });

      await questPersistBroker({ questFilePath, contents, questId });

      expect(proxy.getWrittenContent()).toBe('{"name":"add-auth"}');
    });

    it('VALID: {questFilePath, contents, questId} => writes to correct file path', async () => {
      const proxy = questPersistBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/fix-bug/quest.json' });
      const contents = FileContentsStub({ value: '{"name":"fix-bug"}' });
      const questId = QuestIdStub({ value: 'fix-bug' });
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const outboxFilePath = FilePathStub({
        value: '/home/testuser/.dungeonmaster/event-outbox.jsonl',
      });

      proxy.setupPersist({ homePath, outboxFilePath });

      await questPersistBroker({ questFilePath, contents, questId });

      expect(proxy.getWrittenPath()).toBe('/quests/fix-bug/quest.json');
    });
  });

  describe('error cases', () => {
    it('ERROR: {write fails} => throws write error', async () => {
      const proxy = questPersistBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/add-auth/quest.json' });
      const contents = FileContentsStub({ value: '{"name":"add-auth"}' });
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupWriteFailure({ error: new Error('ENOENT: no such file or directory') });

      await expect(questPersistBroker({ questFilePath, contents, questId })).rejects.toThrow(
        /ENOENT: no such file or directory/u,
      );
    });

    it('ERROR: {outbox append fails} => throws outbox error', async () => {
      const proxy = questPersistBrokerProxy();
      const questFilePath = FilePathStub({ value: '/quests/add-auth/quest.json' });
      const contents = FileContentsStub({ value: '{"name":"add-auth"}' });
      const questId = QuestIdStub({ value: 'add-auth' });
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const outboxFilePath = FilePathStub({
        value: '/home/testuser/.dungeonmaster/event-outbox.jsonl',
      });

      proxy.setupOutboxFailure({
        homePath,
        outboxFilePath,
        error: new Error('Permission denied'),
      });

      await expect(questPersistBroker({ questFilePath, contents, questId })).rejects.toThrow(
        /Permission denied/u,
      );
    });
  });
});
