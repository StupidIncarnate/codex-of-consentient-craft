import { getQuestInputContract } from './get-quest-input-contract';
import { GetQuestInputStub } from './get-quest-input.stub';

describe('getQuestInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {questId: "add-auth"} => parses successfully', () => {
      const input = GetQuestInputStub({ questId: 'add-auth' });

      const result = getQuestInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth' });
    });

    it('VALID: {questId: "test-quest"} => parses with default stub value', () => {
      const input = GetQuestInputStub();

      const result = getQuestInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'test-quest' });
    });

    it('VALID: {questId with stage} => parses with stage value', () => {
      const input = GetQuestInputStub({
        questId: 'add-auth',
        stage: 'spec',
      });

      const result = getQuestInputContract.parse(input);

      expect(result).toStrictEqual({
        questId: 'add-auth',
        stage: 'spec',
      });
    });

    it('VALID: {questId with spec-decisions stage} => parses successfully', () => {
      const input = GetQuestInputStub({ questId: 'add-auth', stage: 'spec-decisions' });

      const result = getQuestInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth', stage: 'spec-decisions' });
    });

    it('VALID: {questId with spec-bdd stage} => parses successfully', () => {
      const input = GetQuestInputStub({ questId: 'add-auth', stage: 'spec-bdd' });

      const result = getQuestInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth', stage: 'spec-bdd' });
    });

    it('VALID: {questId with implementation stage} => parses successfully', () => {
      const input = GetQuestInputStub({ questId: 'add-auth', stage: 'implementation' });

      const result = getQuestInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth', stage: 'implementation' });
    });

    it('VALID: {questId without stage} => stage omitted from result', () => {
      const input = GetQuestInputStub({ questId: 'add-auth' });

      const result = getQuestInputContract.parse(input);

      expect(result).toStrictEqual({ questId: 'add-auth' });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_QUEST_ID: {questId: ""} => throws validation error', () => {
      expect(() => {
        return getQuestInputContract.parse({ questId: '' });
      }).toThrow(/too_small/u);
    });

    it('INVALID_QUEST_ID: {missing questId} => throws validation error', () => {
      expect(() => {
        return getQuestInputContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID_STAGE: {stage with invalid value} => throws validation error', () => {
      expect(() => {
        return getQuestInputContract.parse({ questId: 'add-auth', stage: 'invalid' });
      }).toThrow(/Invalid enum value/u);
    });
  });
});
