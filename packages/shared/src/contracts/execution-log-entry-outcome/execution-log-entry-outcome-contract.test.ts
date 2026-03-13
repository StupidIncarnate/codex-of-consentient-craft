import { executionLogEntryOutcomeContract } from './execution-log-entry-outcome-contract';
import { ExecutionLogEntryOutcomeStub } from './execution-log-entry-outcome.stub';

describe('executionLogEntryOutcomeContract', () => {
  describe('valid values', () => {
    it('VALID: {value: "pass"} => parses successfully', () => {
      const result = ExecutionLogEntryOutcomeStub({ value: 'pass' });

      expect(result).toBe('pass');
    });

    it('VALID: {value: "fail"} => parses successfully', () => {
      const result = ExecutionLogEntryOutcomeStub({ value: 'fail' });

      expect(result).toBe('fail');
    });
  });

  describe('invalid values', () => {
    it('INVALID_VALUE: {value: "success"} => throws validation error', () => {
      expect(() => executionLogEntryOutcomeContract.parse('success')).toThrow(
        /invalid_enum_value/u,
      );
    });

    it('INVALID_VALUE: {value: ""} => throws validation error', () => {
      expect(() => executionLogEntryOutcomeContract.parse('')).toThrow(/invalid_enum_value/u);
    });

    it('INVALID_VALUE: {value: 123} => throws validation error', () => {
      expect(() => executionLogEntryOutcomeContract.parse(123)).toThrow(/invalid_type/u);
    });
  });
});
