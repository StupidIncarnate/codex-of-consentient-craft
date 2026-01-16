import { questRequirementContract } from './quest-requirement-contract';
import { QuestRequirementStub } from './quest-requirement.stub';

describe('questRequirementContract', () => {
  describe('valid quest tasks', () => {
    it('VALID: minimal task => parses successfully', () => {
      const task = QuestRequirementStub();

      const result = questRequirementContract.parse(task);

      expect(result).toStrictEqual({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Create service',
        type: 'implementation',
        status: 'pending',
        observableIds: [],
      });
    });

    it('VALID: task with all fields => parses successfully', () => {
      const task = QuestRequirementStub({
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        name: 'Write tests',
        type: 'testing',
        description: 'Write unit tests for the service',
        status: 'complete',
        dependencies: ['f47ac10b-58cc-4372-a567-0e02b2c3d479'],
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T12:00:00.000Z',
        observableIds: ['b2c3d4e5-f6a7-8901-bcde-f12345678901'],
      });

      const result = questRequirementContract.parse(task);

      expect(result.name).toBe('Write tests');
      expect(result.type).toBe('testing');
      expect(result.status).toBe('complete');
      expect(result.observableIds).toStrictEqual(['b2c3d4e5-f6a7-8901-bcde-f12345678901']);
    });

    it('VALID: task with multiple observableIds => parses successfully', () => {
      const task = QuestRequirementStub({
        observableIds: [
          'b2c3d4e5-f6a7-8901-bcde-f12345678901',
          'c3d4e5f6-a7b8-9012-cdef-123456789012',
        ],
      });

      const result = questRequirementContract.parse(task);

      expect(result.observableIds).toStrictEqual([
        'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        'c3d4e5f6-a7b8-9012-cdef-123456789012',
      ]);
    });
  });

  describe('invalid quest tasks', () => {
    it('INVALID: missing required fields => throws validation error', () => {
      expect(() => {
        questRequirementContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: invalid uuid => throws validation error', () => {
      expect(() => {
        questRequirementContract.parse({
          id: 'not-a-uuid',
          name: 'Task',
          type: 'implementation',
          status: 'pending',
        });
      }).toThrow(/Invalid uuid/u);
    });

    it('INVALID: empty name => throws validation error', () => {
      expect(() => {
        questRequirementContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          name: '',
          type: 'implementation',
          status: 'pending',
          observableIds: [],
        });
      }).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: observableIds with invalid uuid => throws validation error', () => {
      expect(() => {
        questRequirementContract.parse({
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          name: 'Task',
          type: 'implementation',
          status: 'pending',
          observableIds: ['not-a-uuid'],
        });
      }).toThrow(/Invalid uuid/u);
    });
  });
});
