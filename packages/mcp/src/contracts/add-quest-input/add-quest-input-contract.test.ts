import { addQuestInputContract as _addQuestInputContract } from './add-quest-input-contract';
import { AddQuestInputStub } from './add-quest-input.stub';

describe('addQuestInputContract', () => {
  it('VALID: {title, userRequest, tasks: []} => parses successfully', () => {
    const result = AddQuestInputStub({
      title: 'Add Authentication',
      userRequest: 'User wants to add authentication to the app',
      tasks: [],
    });

    expect(result).toStrictEqual({
      title: 'Add Authentication',
      userRequest: 'User wants to add authentication to the app',
      tasks: [],
    });
  });

  it('VALID: {title, userRequest, tasks: [task]} => parses successfully', () => {
    const result = AddQuestInputStub({
      title: 'Add Authentication',
      userRequest: 'User wants to add authentication',
      tasks: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Create auth service',
          type: 'implementation',
          description: 'Implement authentication service',
          dependencies: [],
          filesToCreate: ['src/services/auth.ts'],
          filesToEdit: ['src/index.ts'],
        },
      ],
    });

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0]?.name).toBe('Create auth service');
    expect(result.tasks[0]?.type).toBe('implementation');
  });

  it('VALID: task with all optional fields omitted => parses successfully', () => {
    const result = AddQuestInputStub({
      tasks: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Simple task',
          type: 'discovery',
        },
      ],
    });

    expect(result.tasks[0]).toStrictEqual({
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Simple task',
      type: 'discovery',
    });
  });

  it('VALID: task type "testing" => parses successfully', () => {
    const result = AddQuestInputStub({
      tasks: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Write tests',
          type: 'testing',
        },
      ],
    });

    expect(result.tasks[0]?.type).toBe('testing');
  });

  it('VALID: task type "review" => parses successfully', () => {
    const result = AddQuestInputStub({
      tasks: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Review code',
          type: 'review',
        },
      ],
    });

    expect(result.tasks[0]?.type).toBe('review');
  });

  it('VALID: task type "documentation" => parses successfully', () => {
    const result = AddQuestInputStub({
      tasks: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Write docs',
          type: 'documentation',
        },
      ],
    });

    expect(result.tasks[0]?.type).toBe('documentation');
  });

  it('VALID: task with dependencies => parses successfully', () => {
    const result = AddQuestInputStub({
      tasks: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Task 1',
          type: 'implementation',
        },
        {
          id: '223e4567-e89b-12d3-a456-426614174000',
          name: 'Task 2',
          type: 'testing',
          dependencies: ['123e4567-e89b-12d3-a456-426614174000'],
        },
      ],
    });

    expect(result.tasks[1]?.dependencies).toStrictEqual(['123e4567-e89b-12d3-a456-426614174000']);
  });
});
