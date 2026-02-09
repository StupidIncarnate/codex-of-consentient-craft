import { startQuestInputContract } from './start-quest-input-contract';
import { StartQuestInputStub } from './start-quest-input.stub';

describe('startQuestInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {questId: string} => parses successfully', () => {
      const input = StartQuestInputStub({ questId: 'add-auth' });

      const result = startQuestInputContract.parse(input);

      expect(result).toStrictEqual({
        questId: 'add-auth',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_QUEST_ID: {questId: empty string} => throws validation error', () => {
      expect(() => {
        startQuestInputContract.parse({ questId: '' });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID_QUEST_ID: {questId: missing} => throws validation error', () => {
      expect(() => {
        startQuestInputContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
