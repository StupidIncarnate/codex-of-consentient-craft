import { executionStepStatusContract } from './execution-step-status-contract';
import { ExecutionStepStatusStub } from './execution-step-status.stub';

describe('executionStepStatusContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "queued"} => parses queued status', () => {
      const result = executionStepStatusContract.parse('queued');

      expect(result).toBe('queued');
    });

    it('VALID: {value: "pending"} => parses pending status', () => {
      const result = executionStepStatusContract.parse('pending');

      expect(result).toBe('pending');
    });

    it('VALID: {value: "in_progress"} => parses in_progress status', () => {
      const result = executionStepStatusContract.parse('in_progress');

      expect(result).toBe('in_progress');
    });

    it('VALID: {value: "complete"} => parses complete status', () => {
      const result = executionStepStatusContract.parse('complete');

      expect(result).toBe('complete');
    });

    it('VALID: {value: "failed"} => parses failed status', () => {
      const result = executionStepStatusContract.parse('failed');

      expect(result).toBe('failed');
    });

    it('VALID: {value: "partially_complete"} => parses partially_complete status', () => {
      const result = executionStepStatusContract.parse('partially_complete');

      expect(result).toBe('partially_complete');
    });

    it('VALID: {value: "blocked"} => parses blocked status', () => {
      const result = executionStepStatusContract.parse('blocked');

      expect(result).toBe('blocked');
    });

    it('VALID: {value: "skipped"} => parses skipped status', () => {
      const result = executionStepStatusContract.parse('skipped');

      expect(result).toBe('skipped');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: "unknown"} => throws for invalid status', () => {
      expect(() => executionStepStatusContract.parse('unknown')).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {value: 123} => throws for number', () => {
      expect(() => executionStepStatusContract.parse(123)).toThrow(/received number/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid status with default value pending', () => {
      const result = ExecutionStepStatusStub();

      expect(result).toBe('pending');
    });

    it('VALID: {value: "complete"} => creates status with custom value', () => {
      const result = ExecutionStepStatusStub({ value: 'complete' });

      expect(result).toBe('complete');
    });
  });
});
