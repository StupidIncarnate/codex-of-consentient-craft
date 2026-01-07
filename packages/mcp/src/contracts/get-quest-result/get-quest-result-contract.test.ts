import { QuestStub } from '@dungeonmaster/shared/contracts';

import { getQuestResultContract } from './get-quest-result-contract';
import { GetQuestResultStub } from './get-quest-result.stub';

describe('getQuestResultContract', () => {
  describe('valid results', () => {
    it('VALID: {success: true, quest} => parses successfully', () => {
      const quest = QuestStub({ id: 'add-auth' });
      const result = GetQuestResultStub({ success: true, quest });

      const parsed = getQuestResultContract.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.quest?.id).toBe('add-auth');
    });

    it('VALID: {success: false, error} => parses error result', () => {
      const result = getQuestResultContract.parse({
        success: false,
        error: 'Quest not found',
      });

      expect(result).toStrictEqual({
        success: false,
        error: 'Quest not found',
      });
    });

    it('VALID: {success: true, quest with all fields} => parses full quest', () => {
      const quest = QuestStub({
        id: 'test-quest',
        title: 'Test Quest',
        folder: '001-test-quest',
      });

      const result = getQuestResultContract.parse({
        success: true,
        quest,
      });

      expect(result.success).toBe(true);
      expect(result.quest?.id).toBe('test-quest');
      expect(result.quest?.title).toBe('Test Quest');
      expect(result.quest?.folder).toBe('001-test-quest');
    });
  });

  describe('invalid results', () => {
    it('INVALID_SUCCESS: {missing success} => throws validation error', () => {
      expect(() => {
        return getQuestResultContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
