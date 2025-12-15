import { taskTypeContract } from './task-type-contract';
import { TaskTypeStub } from './task-type.stub';

describe('taskTypeContract', () => {
  describe('valid types', () => {
    it('VALID: implementation => parses successfully', () => {
      const taskType = TaskTypeStub({ value: 'implementation' });

      const result = taskTypeContract.parse(taskType);

      expect(result).toBe('implementation');
    });

    it('VALID: testing => parses successfully', () => {
      const taskType = TaskTypeStub({ value: 'testing' });

      const result = taskTypeContract.parse(taskType);

      expect(result).toBe('testing');
    });

    it('VALID: documentation => parses successfully', () => {
      const taskType = TaskTypeStub({ value: 'documentation' });

      const result = taskTypeContract.parse(taskType);

      expect(result).toBe('documentation');
    });

    it('VALID: refactoring => parses successfully', () => {
      const taskType = TaskTypeStub({ value: 'refactoring' });

      const result = taskTypeContract.parse(taskType);

      expect(result).toBe('refactoring');
    });
  });

  describe('invalid types', () => {
    it('INVALID: unknown type => throws validation error', () => {
      expect(() => {
        taskTypeContract.parse('invalid_type');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
