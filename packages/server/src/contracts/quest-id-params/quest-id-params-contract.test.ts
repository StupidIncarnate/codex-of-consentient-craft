import { questIdParamsContract } from './quest-id-params-contract';
import { QuestIdParamsStub } from './quest-id-params.stub';

describe('questIdParamsContract', () => {
  describe('valid inputs', () => {
    it('VALID: {questId: "test-quest"} => parses successfully', () => {
      const result = QuestIdParamsStub({ questId: 'test-quest' });

      expect(result.questId).toBe('test-quest');
    });

    it('VALID: parsing valid params returns typed result', () => {
      const result = questIdParamsContract.parse({ questId: 'abc' });

      expect(result.questId).toBe('abc');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {questId: ""} => throws validation error', () => {
      expect(() => {
        questIdParamsContract.parse({ questId: '' });
      }).toThrow(/at least 1/u);
    });

    it('INVALID: {missing questId} => throws validation error', () => {
      expect(() => {
        questIdParamsContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
