import { questPersistDirectBroker } from './quest-persist-direct-broker';
import { questPersistDirectBrokerProxy } from './quest-persist-direct-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import { FilePathStub, FileContentsStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

describe('questPersistDirectBroker', () => {
  describe('a successful persist', () => {
    it('VALID: {questFilePath, contents, questId} => writes the file and appends one outbox line', async () => {
      const proxy = questPersistDirectBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      const questFilePath = FilePathStub({
        value: '/tmp/dm-home/guilds/g1/quests/add-auth/quest.json',
      });
      const outboxPath = '/tmp/dm-home/event-outbox.jsonl';
      proxy.succeeds({ questFilePath, outboxPath });

      const result = await questPersistDirectBroker({
        target,
        questFilePath,
        contents: FileContentsStub({ value: '{"id":"add-auth"}' }),
        questId: QuestIdStub({ value: 'add-auth' }),
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getWrittenContents({ questFilePath })).toBe('{"id":"add-auth"}');
    });

    it('VALID: {questId} => the appended outbox line names that exact questId', async () => {
      const proxy = questPersistDirectBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      const questFilePath = FilePathStub({
        value: '/tmp/dm-home/guilds/g1/quests/add-auth/quest.json',
      });
      const outboxPath = '/tmp/dm-home/event-outbox.jsonl';
      proxy.succeeds({ questFilePath, outboxPath });

      await questPersistDirectBroker({
        target,
        questFilePath,
        contents: FileContentsStub({ value: '{}' }),
        questId: QuestIdStub({ value: 'add-auth' }),
      });

      expect(proxy.getOutboxLine({ outboxPath }).questId).toBe('add-auth');
    });
  });
});
