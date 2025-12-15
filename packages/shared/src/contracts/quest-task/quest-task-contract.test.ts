import { questTaskContract } from './quest-task-contract';
import { QuestTaskStub } from './quest-task.stub';

describe('questTaskContract', () => {
  describe('valid quest tasks', () => {
    it('VALID: minimal task => parses successfully', () => {
      const task = QuestTaskStub();

      const result = questTaskContract.parse(task);

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Create service',
        type: 'implementation',
        status: 'pending',
      });
    });

    it('VALID: task with all fields => parses successfully', () => {
      const task = QuestTaskStub({
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'Write tests',
        type: 'testing',
        description: 'Write unit tests for the service',
        status: 'complete',
        dependencies: ['f47ac10b-58cc-4372-a567-0e02b2c3d479'],
        filesToCreate: ['src/service.test.ts'],
        filesToEdit: [],
        completedBy: '002-codeweaver-report.json',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T12:00:00.000Z',
      });

      const result = questTaskContract.parse(task);

      expect(result.name).toBe('Write tests');
      expect(result.type).toBe('testing');
      expect(result.status).toBe('complete');
    });

    it('VALID: failed task with error => parses successfully', () => {
      const task = QuestTaskStub({
        status: 'failed',
        errorMessage: 'Type error in service.ts',
      });

      const result = questTaskContract.parse(task);

      expect(result.status).toBe('failed');
      expect(result.errorMessage).toBe('Type error in service.ts');
    });
  });

  describe('invalid quest tasks', () => {
    it('INVALID: missing required fields => throws validation error', () => {
      expect(() => {
        questTaskContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: invalid uuid => throws validation error', () => {
      expect(() => {
        questTaskContract.parse({
          id: 'not-a-uuid',
          name: 'Task',
          type: 'implementation',
          status: 'pending',
        });
      }).toThrow(/Invalid uuid/u);
    });

    it('INVALID: empty name => throws validation error', () => {
      expect(() => {
        questTaskContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          name: '',
          type: 'implementation',
          status: 'pending',
        });
      }).toThrow(/String must contain at least 1 character/u);
    });
  });
});
