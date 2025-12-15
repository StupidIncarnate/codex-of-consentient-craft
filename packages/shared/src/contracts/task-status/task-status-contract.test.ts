import { taskStatusContract } from './task-status-contract';
import { TaskStatusStub } from './task-status.stub';

describe('taskStatusContract', () => {
  describe('valid statuses', () => {
    it('VALID: pending => parses successfully', () => {
      const status = TaskStatusStub({ value: 'pending' });

      const result = taskStatusContract.parse(status);

      expect(result).toBe('pending');
    });

    it('VALID: in_progress => parses successfully', () => {
      const status = TaskStatusStub({ value: 'in_progress' });

      const result = taskStatusContract.parse(status);

      expect(result).toBe('in_progress');
    });

    it('VALID: complete => parses successfully', () => {
      const status = TaskStatusStub({ value: 'complete' });

      const result = taskStatusContract.parse(status);

      expect(result).toBe('complete');
    });

    it('VALID: failed => parses successfully', () => {
      const status = TaskStatusStub({ value: 'failed' });

      const result = taskStatusContract.parse(status);

      expect(result).toBe('failed');
    });

    it('VALID: skipped => parses successfully', () => {
      const status = TaskStatusStub({ value: 'skipped' });

      const result = taskStatusContract.parse(status);

      expect(result).toBe('skipped');
    });
  });

  describe('invalid statuses', () => {
    it('INVALID: unknown status => throws validation error', () => {
      expect(() => {
        taskStatusContract.parse('invalid_status');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
