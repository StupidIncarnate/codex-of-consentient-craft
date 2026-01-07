import { QuestStub } from '@dungeonmaster/shared/contracts';

import { questGetBroker } from './quest-get-broker';
import { questGetBrokerProxy } from './quest-get-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { GetQuestInputStub } from '../../../contracts/get-quest-input/get-quest-input.stub';
import { QuestDatabaseStub } from '../../../contracts/quest-database/quest-database.stub';

describe('questGetBroker', () => {
  describe('successful retrieval', () => {
    it('VALID: {questId exists} => returns quest', async () => {
      const proxy = questGetBrokerProxy();
      const dbPath = FilePathStub({ value: '/path/to/db.json' });
      const quest = QuestStub({ id: 'add-auth', title: 'Add Authentication' });
      const database = QuestDatabaseStub({ quests: [quest] });

      proxy.setupQuestFound({ dbPath, database });

      const input = GetQuestInputStub({ questId: 'add-auth' });
      const result = await questGetBroker({ input, dbPath });

      expect(result.success).toBe(true);
      expect(result.quest?.id).toBe('add-auth');
      expect(result.quest?.title).toBe('Add Authentication');
    });

    it('VALID: {questId in multiple quests} => returns correct quest', async () => {
      const proxy = questGetBrokerProxy();
      const dbPath = FilePathStub({ value: '/path/to/db.json' });
      const quest1 = QuestStub({ id: 'add-auth', title: 'Add Authentication' });
      const quest2 = QuestStub({ id: 'fix-bug', title: 'Fix Bug' });
      const database = QuestDatabaseStub({ quests: [quest1, quest2] });

      proxy.setupQuestFound({ dbPath, database });

      const input = GetQuestInputStub({ questId: 'fix-bug' });
      const result = await questGetBroker({ input, dbPath });

      expect(result.success).toBe(true);
      expect(result.quest?.id).toBe('fix-bug');
      expect(result.quest?.title).toBe('Fix Bug');
    });
  });

  describe('quest not found', () => {
    it('ERROR: {questId not exists} => returns not found error', async () => {
      const proxy = questGetBrokerProxy();
      const dbPath = FilePathStub({ value: '/path/to/db.json' });
      const quest = QuestStub({ id: 'add-auth' });
      const database = QuestDatabaseStub({ quests: [quest] });

      proxy.setupQuestFound({ dbPath, database });

      const input = GetQuestInputStub({ questId: 'nonexistent' });
      const result = await questGetBroker({ input, dbPath });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Quest not found: nonexistent');
    });

    it('ERROR: {empty database} => returns not found error', async () => {
      const proxy = questGetBrokerProxy();
      const dbPath = FilePathStub({ value: '/path/to/db.json' });

      proxy.setupEmptyDatabase({ dbPath });

      const input = GetQuestInputStub({ questId: 'any-quest' });
      const result = await questGetBroker({ input, dbPath });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Quest not found: any-quest');
    });
  });
});
