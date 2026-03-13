import { pathseekerRunStatusContract } from './pathseeker-run-status-contract';
import { PathseekerRunStatusStub } from './pathseeker-run-status.stub';

describe('pathseekerRunStatusContract', () => {
  describe('valid statuses', () => {
    it('VALID: {in_progress} => parses successfully', () => {
      const result = PathseekerRunStatusStub({ value: 'in_progress' });

      expect(result).toBe('in_progress');
    });

    it('VALID: {complete} => parses successfully', () => {
      const result = PathseekerRunStatusStub({ value: 'complete' });

      expect(result).toBe('complete');
    });

    it('VALID: {failed} => parses successfully', () => {
      const result = PathseekerRunStatusStub({ value: 'failed' });

      expect(result).toBe('failed');
    });

    it('VALID: {verification_failed} => parses successfully', () => {
      const result = PathseekerRunStatusStub({ value: 'verification_failed' });

      expect(result).toBe('verification_failed');
    });
  });

  describe('invalid statuses', () => {
    it('INVALID_STATUS: {unknown status} => throws validation error', () => {
      expect(() => {
        pathseekerRunStatusContract.parse('unknown');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID_TYPE: {number} => throws validation error', () => {
      expect(() => {
        pathseekerRunStatusContract.parse(123 as never);
      }).toThrow(/Expected/u);
    });
  });
});
