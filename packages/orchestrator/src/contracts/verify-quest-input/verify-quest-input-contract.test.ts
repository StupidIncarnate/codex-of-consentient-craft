import { verifyQuestInputContract } from './verify-quest-input-contract';
import { VerifyQuestInputStub } from './verify-quest-input.stub';

describe('verifyQuestInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {questId: "add-auth"} => parses successfully', () => {
      const input = VerifyQuestInputStub({ questId: 'add-auth' });

      const result = verifyQuestInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth' });
    });

    it('VALID: {questId: "test-quest"} => parses with default stub value', () => {
      const input = VerifyQuestInputStub();

      const result = verifyQuestInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'test-quest' });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_QUEST_ID: {questId: ""} => throws validation error', () => {
      expect(() => {
        return verifyQuestInputContract.parse({ questId: '' });
      }).toThrow(/too_small/u);
    });

    it('INVALID_QUEST_ID: {missing questId} => throws validation error', () => {
      expect(() => {
        return verifyQuestInputContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
