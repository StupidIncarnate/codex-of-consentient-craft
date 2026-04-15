import { getQuestInputContract } from './get-quest-input-contract';
import { GetQuestInputStub } from './get-quest-input.stub';

describe('getQuestInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {questId: "add-auth"} => parses successfully', () => {
      const input = GetQuestInputStub({ questId: 'add-auth' });

      const result = getQuestInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth' });
    });

    it('VALID: {questId with stage} => parses with stage value', () => {
      const input = GetQuestInputStub({ questId: 'add-auth', stage: 'spec' });

      const result = getQuestInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth', stage: 'spec' });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {questId: ""} => throws validation error', () => {
      expect(() => {
        return getQuestInputContract.parse({ questId: '' });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {stage with invalid value} => throws validation error', () => {
      expect(() => {
        return getQuestInputContract.parse({ questId: 'add-auth', stage: 'invalid' });
      }).toThrow(/Invalid enum value/u);
    });
  });
});
