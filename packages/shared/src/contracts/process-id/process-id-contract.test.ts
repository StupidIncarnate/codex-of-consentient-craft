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
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => {
        processIdContract.parse('');
      }).toThrow(/expected string to have >=1 characters/u);
    });

    it('INVALID: {value: 123} => throws validation error', () => {
      expect(() => {
        processIdContract.parse(123 as never);
      }).toThrow(/expected string/u);
    });

    it('INVALID: {value: null} => throws validation error', () => {
      expect(() => {
        processIdContract.parse(null);
      }).toThrow(/expected string/u);
    });
  });
});
