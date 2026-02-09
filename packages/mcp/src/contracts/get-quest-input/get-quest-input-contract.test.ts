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

    it('VALID: {questId with sections} => parses with sections array', () => {
      const input = GetQuestInputStub({
        questId: 'add-auth',
        sections: ['requirements', 'observables'],
      });

      const result = getQuestInputContract.parse(input);

      expect(result).toStrictEqual({
        questId: 'add-auth',
        sections: ['requirements', 'observables'],
      });
    });

    it('VALID: {questId with all sections} => parses all section values', () => {
      const input = GetQuestInputStub({
        questId: 'add-auth',
        sections: [
          'requirements',
          'designDecisions',
          'contexts',
          'observables',
          'steps',
          'toolingRequirements',
          'executionLog',
        ],
      });

      const result = getQuestInputContract.parse(input);

      expect(result).toStrictEqual({
        questId: 'add-auth',
        sections: [
          'requirements',
          'designDecisions',
          'contexts',
          'observables',
          'steps',
          'toolingRequirements',
          'executionLog',
        ],
      });
    });

    it('VALID: {questId with empty sections array} => parses successfully', () => {
      const input = GetQuestInputStub({
        questId: 'add-auth',
        sections: [],
      });

      const result = getQuestInputContract.parse(input);

      expect(result).toStrictEqual({
        questId: 'add-auth',
        sections: [],
      });
    });

    it('VALID: {questId without sections} => sections omitted from result', () => {
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

    it('INVALID_SECTION: {sections with invalid value} => throws validation error', () => {
      expect(() => {
        return getQuestInputContract.parse({ questId: 'add-auth', sections: ['invalid'] });
      }).toThrow(/Invalid enum value/u);
    });
  });
});
