import { FilePathStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { GetQuestInputStub } from '../../../contracts/get-quest-input/get-quest-input.stub';
import { questGetBroker } from './quest-get-broker';
import { questGetBrokerProxy } from './quest-get-broker.proxy';

describe('questGetBroker', () => {
  describe('successful retrieval', () => {
    it('VALID: {questId exists} => returns quest', async () => {
      const proxy = questGetBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src' });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
      });

      proxy.setupQuestFound({ quest, startPath });

      const input = GetQuestInputStub({ questId: 'add-auth' });
      const result = await questGetBroker({ input, startPath });

      expect(result.success).toBe(true);
      expect(result.quest?.id).toBe('add-auth');
      expect(result.quest?.title).toBe('Add Authentication');
    });

    it('VALID: {questId with different folder} => returns quest', async () => {
      const proxy = questGetBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src' });
      const quest = QuestStub({ id: 'fix-bug', folder: '002-fix-bug', title: 'Fix Bug' });

      proxy.setupQuestFound({ quest, startPath });

      const input = GetQuestInputStub({ questId: 'fix-bug' });
      const result = await questGetBroker({ input, startPath });

      expect(result.success).toBe(true);
      expect(result.quest?.id).toBe('fix-bug');
      expect(result.quest?.title).toBe('Fix Bug');
    });
  });

  describe('quest not found', () => {
    it('ERROR: {questId not exists} => returns not found error', async () => {
      const proxy = questGetBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src' });
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });

      proxy.setupQuestFound({ quest, startPath });

      const input = GetQuestInputStub({ questId: 'nonexistent' });
      const result = await questGetBroker({ input, startPath });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Quest not found: nonexistent');
    });

    it('ERROR: {empty folder} => returns not found error', async () => {
      const proxy = questGetBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src' });

      proxy.setupEmptyFolder({ startPath });

      const input = GetQuestInputStub({ questId: 'any-quest' });
      const result = await questGetBroker({ input, startPath });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Quest not found: any-quest');
    });
  });

  describe('graceful folder handling', () => {
    it('VALID: {folder does not exist} => creates folder and returns quest not found', async () => {
      const proxy = questGetBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src' });

      proxy.setupEmptyFolder({ startPath });

      const input = GetQuestInputStub({ questId: 'any-quest' });
      const result = await questGetBroker({ input, startPath });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Quest not found: any-quest');
    });
  });
});
