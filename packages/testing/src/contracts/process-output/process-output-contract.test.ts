import { processOutputContract } from './process-output-contract';
import { ProcessOutputStub } from './process-output.stub';

describe('processOutputContract', () => {
  describe('valid process output', () => {
    it('VALID: {value: ""} => parses empty output', () => {
      const output = ProcessOutputStub({ value: '' });

      const result = processOutputContract.parse(output);

      expect(result).toBe('');
    });

    it('VALID: {value: "test output"} => parses stdout', () => {
      const output = ProcessOutputStub({ value: 'test output' });

      const result = processOutputContract.parse(output);

      expect(result).toBe('test output');
    });

    it('VALID: {value: "Error: failed"} => parses stderr', () => {
      const output = ProcessOutputStub({ value: 'Error: failed' });

      const result = processOutputContract.parse(output);

      expect(result).toBe('Error: failed');
    });

    it('VALID: {value: multiline} => parses multiline output', () => {
      const multiline = 'line 1\nline 2\nline 3';
      const output = ProcessOutputStub({ value: multiline });

      const result = processOutputContract.parse(output);

      expect(result).toBe(multiline);
    });
  });

  describe('invalid process output', () => {
    it('INVALID_PROCESS_OUTPUT: {value: 123} => throws validation error for number', () => {
      expect(() => {
        return processOutputContract.parse(123 as never);
      }).toThrow(/string/iu);
    });

    it('INVALID_PROCESS_OUTPUT: {value: null} => throws validation error for null', () => {
      expect(() => {
        return processOutputContract.parse(null as never);
      }).toThrow(/string/iu);
    });
  });
});
