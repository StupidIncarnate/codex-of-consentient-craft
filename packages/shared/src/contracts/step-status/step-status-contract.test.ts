import { stepStatusContract } from './step-status-contract';
import { StepStatusStub } from './step-status.stub';

describe('stepStatusContract', () => {
  describe('valid statuses', () => {
    it('VALID: pending => parses successfully', () => {
      const status = StepStatusStub({ value: 'pending' });

      const result = stepStatusContract.parse(status);

      expect(result).toBe('pending');
    });

    it('VALID: in_progress => parses successfully', () => {
      const status = StepStatusStub({ value: 'in_progress' });

      const result = stepStatusContract.parse(status);

      expect(result).toBe('in_progress');
    });

    it('VALID: complete => parses successfully', () => {
      const status = StepStatusStub({ value: 'complete' });

      const result = stepStatusContract.parse(status);

      expect(result).toBe('complete');
    });

    it('VALID: failed => parses successfully', () => {
      const status = StepStatusStub({ value: 'failed' });

      const result = stepStatusContract.parse(status);

      expect(result).toBe('failed');
    });

    it('VALID: blocked => parses successfully', () => {
      const status = StepStatusStub({ value: 'blocked' });

      const result = stepStatusContract.parse(status);

      expect(result).toBe('blocked');
    });

    it('VALID: partially_complete => parses successfully', () => {
      const status = StepStatusStub({ value: 'partially_complete' });

      const result = stepStatusContract.parse(status);

      expect(result).toBe('partially_complete');
    });
  });

  describe('invalid statuses', () => {
    it('INVALID: unknown status => throws validation error', () => {
      expect(() => {
        stepStatusContract.parse('invalid_status');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
