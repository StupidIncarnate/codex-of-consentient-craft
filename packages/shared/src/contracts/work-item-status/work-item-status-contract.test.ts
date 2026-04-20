import { workItemStatusContract } from './work-item-status-contract';
import { WorkItemStatusStub } from './work-item-status.stub';

describe('workItemStatusContract', () => {
  describe('valid statuses', () => {
    it('VALID: pending => parses successfully', () => {
      const status = WorkItemStatusStub({ value: 'pending' });

      const result = workItemStatusContract.parse(status);

      expect(result).toBe('pending');
    });

    it('VALID: queued => parses successfully', () => {
      const status = WorkItemStatusStub({ value: 'queued' });

      const result = workItemStatusContract.parse(status);

      expect(result).toBe('queued');
    });

    it('VALID: in_progress => parses successfully', () => {
      const status = WorkItemStatusStub({ value: 'in_progress' });

      const result = workItemStatusContract.parse(status);

      expect(result).toBe('in_progress');
    });

    it('VALID: complete => parses successfully', () => {
      const status = WorkItemStatusStub({ value: 'complete' });

      const result = workItemStatusContract.parse(status);

      expect(result).toBe('complete');
    });

    it('VALID: failed => parses successfully', () => {
      const status = WorkItemStatusStub({ value: 'failed' });

      const result = workItemStatusContract.parse(status);

      expect(result).toBe('failed');
    });

    it('VALID: {default} => defaults to pending', () => {
      const status = WorkItemStatusStub();

      expect(status).toBe('pending');
    });
  });

  describe('invalid statuses', () => {
    it('INVALID: unknown status => throws validation error', () => {
      expect(() => {
        workItemStatusContract.parse('invalid_status');
      }).toThrow(/Invalid enum value/u);
    });

    it('VALID: skipped => parses successfully', () => {
      const status = WorkItemStatusStub({ value: 'skipped' });

      const result = workItemStatusContract.parse(status);

      expect(result).toBe('skipped');
    });
  });
});
