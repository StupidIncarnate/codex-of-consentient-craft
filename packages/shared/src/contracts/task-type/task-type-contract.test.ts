import { taskTypeContract } from './task-type-contract';
import { TaskTypeStub } from './task-type.stub';

describe('taskTypeContract', () => {
  describe('valid types', () => {
    it('VALID: discovery => parses successfully', () => {
      const taskType = TaskTypeStub({ value: 'discovery' });

      const result = taskTypeContract.parse(taskType);

      expect(result).toBe('discovery');
    });

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

    it('VALID: review => parses successfully', () => {
      const taskType = TaskTypeStub({ value: 'review' });

      const result = taskTypeContract.parse(taskType);

      expect(result).toBe('review');
    });

    it('VALID: documentation => parses successfully', () => {
      const taskType = TaskTypeStub({ value: 'documentation' });

      const result = taskTypeContract.parse(taskType);

      expect(result).toBe('documentation');
    });

    it('VALID: configuration => parses successfully', () => {
      const taskType = TaskTypeStub({ value: 'configuration' });

      const result = taskTypeContract.parse(taskType);

      expect(result).toBe('configuration');
    });

    it('VALID: migration => parses successfully', () => {
      const taskType = TaskTypeStub({ value: 'migration' });

      const result = taskTypeContract.parse(taskType);

      expect(result).toBe('migration');
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
