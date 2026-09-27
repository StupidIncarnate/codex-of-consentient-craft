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
    it('INVALID: {processId: empty string} => throws validation error', () => {
      expect(() => {
        getQuestStatusInputContract.parse({ processId: '' });
      }).toThrow(/expected string to have >=1 characters/u);
    });

    it('INVALID: {processId: missing} => throws validation error', () => {
      expect(() => {
        getQuestStatusInputContract.parse({});
      }).toThrow(/received undefined/u);
    });

    it('INVALID: {unknown key} => throws Unrecognized key error', () => {
      expect(() => {
        getQuestStatusInputContract.parse({ processId: 'proc-123', pid: 9999 } as never);
      }).toThrow(/Unrecognized key/u);
    });
  });
});
