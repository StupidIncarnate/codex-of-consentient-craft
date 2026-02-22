import { startQuestResultContract } from './start-quest-result-contract';
import { StartQuestResultStub } from './start-quest-result.stub';

describe('startQuestResultContract', () => {
  describe('valid results', () => {
    it('VALID: {success: true, processId} => parses successfully', () => {
      const result = StartQuestResultStub({ success: true, processId: 'proc-123' });

      const parsed = startQuestResultContract.parse(result);

      expect(parsed).toStrictEqual({
        success: true,
        processId: 'proc-123',
      });
    });

    it('VALID: {success: false, error} => parses successfully', () => {
      const result = startQuestResultContract.parse({
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
        startQuestResultContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
