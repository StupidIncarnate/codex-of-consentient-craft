import { getQuestStatusInputContract } from './get-quest-status-input-contract';
import { GetQuestStatusInputStub } from './get-quest-status-input.stub';

describe('getQuestStatusInputContract', () => {
  describe('valid inputs', () => {
    it('VALID: {processId: string} => parses successfully', () => {
      const input = GetQuestStatusInputStub({ processId: 'proc-123' });

      const result = getQuestStatusInputContract.parse(input);

      expect(result).toStrictEqual({
        processId: 'proc-123',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_PROCESS_ID: {processId: empty string} => throws validation error', () => {
      expect(() => {
        getQuestStatusInputContract.parse({ processId: '' });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID_PROCESS_ID: {processId: missing} => throws validation error', () => {
      expect(() => {
        getQuestStatusInputContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
