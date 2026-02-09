import { modifyQuestResultContract } from './modify-quest-result-contract';
import { ModifyQuestResultStub } from './modify-quest-result.stub';

describe('modifyQuestResultContract', () => {
  describe('valid results', () => {
    it('VALID: {success: true} => parses successfully', () => {
      const result = ModifyQuestResultStub({ success: true });

      const parsed = modifyQuestResultContract.parse(result);

      expect(parsed).toStrictEqual({ success: true });
    });

    it('VALID: {success: false, error} => parses error result', () => {
      const result = modifyQuestResultContract.parse({
        success: false,
        error: 'Quest not found',
      });

      expect(result).toStrictEqual({
        success: false,
        error: 'Quest not found',
      });
    });

    it('VALID: {stub default} => parses with default success', () => {
      const result = ModifyQuestResultStub();

      const parsed = modifyQuestResultContract.parse(result);

      expect(parsed).toStrictEqual({ success: true });
    });
  });

  describe('invalid results', () => {
    it('INVALID_SUCCESS: {missing success} => throws validation error', () => {
      expect(() => {
        return modifyQuestResultContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID_SUCCESS: {success: "true"} => throws validation error', () => {
      expect(() => {
        return modifyQuestResultContract.parse({ success: 'true' });
      }).toThrow(/Expected boolean/u);
    });
  });
});
