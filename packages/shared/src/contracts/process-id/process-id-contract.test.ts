import { processIdContract } from './process-id-contract';
import { ProcessIdStub } from './process-id.stub';

describe('processIdContract', () => {
  describe('valid process IDs', () => {
    it('VALID: {value: "proc-12345"} => parses successfully', () => {
      const result = ProcessIdStub({ value: 'proc-12345' });

      expect(processIdContract.parse(result)).toBe('proc-12345');
    });

    it('VALID: {value: "abc"} => parses minimum length string', () => {
      const result = ProcessIdStub({ value: 'abc' });

      expect(processIdContract.parse(result)).toBe('abc');
    });

    it('VALID: {value: "a"} => parses single character', () => {
      const result = ProcessIdStub({ value: 'a' });

      expect(processIdContract.parse(result)).toBe('a');
    });
  });

  describe('invalid process IDs', () => {
    it('INVALID_EMPTY: {value: ""} => throws validation error', () => {
      expect(() => {
        processIdContract.parse('');
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID_TYPE: {value: 123} => throws validation error', () => {
      expect(() => {
        processIdContract.parse(123 as never);
      }).toThrow(/Expected string/u);
    });

    it('INVALID_NULL: {value: null} => throws validation error', () => {
      expect(() => {
        processIdContract.parse(null);
      }).toThrow(/Expected string/u);
    });
  });
});
