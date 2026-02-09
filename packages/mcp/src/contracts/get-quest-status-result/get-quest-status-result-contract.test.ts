import { getQuestStatusResultContract } from './get-quest-status-result-contract';
import { GetQuestStatusResultStub } from './get-quest-status-result.stub';

describe('getQuestStatusResultContract', () => {
  describe('valid results', () => {
    it('VALID: {success: true} => parses successfully', () => {
      const result = GetQuestStatusResultStub({ success: true });

      const parsed = getQuestStatusResultContract.parse(result);

      expect(parsed).toStrictEqual({
        success: true,
      });
    });

    it('VALID: {success: false, error} => parses successfully', () => {
      const result = getQuestStatusResultContract.parse({
        success: false,
        error: 'Not implemented',
      });

      expect(result).toStrictEqual({
        success: false,
        error: 'Not implemented',
      });
    });
  });

  describe('invalid results', () => {
    it('INVALID_SUCCESS: {success: missing} => throws validation error', () => {
      expect(() => {
        getQuestStatusResultContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
