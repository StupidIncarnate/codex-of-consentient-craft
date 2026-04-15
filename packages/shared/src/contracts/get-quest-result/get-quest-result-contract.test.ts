import { QuestStub } from '../quest/quest.stub';

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
  });

  describe('invalid results', () => {
    it('INVALID: {missing success} => throws validation error', () => {
      expect(() => {
        return getQuestResultContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
