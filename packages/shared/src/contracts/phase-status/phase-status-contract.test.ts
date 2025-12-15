import { phaseStatusContract } from './phase-status-contract';
import { PhaseStatusStub } from './phase-status.stub';

describe('phaseStatusContract', () => {
  describe('valid statuses', () => {
    it('VALID: pending => parses successfully', () => {
      const status = PhaseStatusStub({ value: 'pending' });

      const result = phaseStatusContract.parse(status);

      expect(result).toBe('pending');
    });

    it('VALID: in_progress => parses successfully', () => {
      const status = PhaseStatusStub({ value: 'in_progress' });

      const result = phaseStatusContract.parse(status);

      expect(result).toBe('in_progress');
    });

    it('VALID: complete => parses successfully', () => {
      const status = PhaseStatusStub({ value: 'complete' });

      const result = phaseStatusContract.parse(status);

      expect(result).toBe('complete');
    });

    it('VALID: blocked => parses successfully', () => {
      const status = PhaseStatusStub({ value: 'blocked' });

      const result = phaseStatusContract.parse(status);

      expect(result).toBe('blocked');
    });

    it('VALID: skipped => parses successfully', () => {
      const status = PhaseStatusStub({ value: 'skipped' });

      const result = phaseStatusContract.parse(status);

      expect(result).toBe('skipped');
    });
  });

  describe('invalid statuses', () => {
    it('INVALID: unknown status => throws validation error', () => {
      expect(() => {
        phaseStatusContract.parse('invalid_status');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
