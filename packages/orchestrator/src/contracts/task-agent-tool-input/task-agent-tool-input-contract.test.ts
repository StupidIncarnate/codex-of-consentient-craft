import { taskAgentToolInputContract } from './task-agent-tool-input-contract';
import { TaskAgentToolInputStub } from './task-agent-tool-input.stub';

describe('taskAgentToolInputContract', () => {
  it('VALID: {prompt: "Run X"} => parses successfully', () => {
    const input = TaskAgentToolInputStub({ prompt: 'Run X' });

    expect(input.prompt).toBe('Run X');
  });

  it('VALID: {prompt + extra fields} => passthrough preserves description, subagent_type, model', () => {
    const parsed = taskAgentToolInputContract.parse({
      prompt: 'Verify the spec',
      description: 'ChaosWhisperer gap minion',
      subagent_type: 'general-purpose',
      model: 'sonnet',
    });

    expect(parsed).toStrictEqual({
      prompt: 'Verify the spec',
      description: 'ChaosWhisperer gap minion',
      subagent_type: 'general-purpose',
      model: 'sonnet',
    });
  });

  it('INVALID: {prompt: ""} => throws validation error', () => {
    expect(() => {
      return taskAgentToolInputContract.parse({ prompt: '' });
    }).toThrow(/String must contain at least 1 character/u);
  });

  it('INVALID: {prompt missing} => throws validation error', () => {
    expect(() => {
      return taskAgentToolInputContract.parse({});
    }).toThrow(/Required/u);
  });

  it('INVALID: {prompt is number} => throws validation error', () => {
    expect(() => {
      return taskAgentToolInputContract.parse({ prompt: 42 as never });
    }).toThrow(/Expected string/u);
  });
});
