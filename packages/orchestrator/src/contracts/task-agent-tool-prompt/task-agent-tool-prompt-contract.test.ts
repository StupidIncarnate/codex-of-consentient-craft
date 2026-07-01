import { taskAgentToolPromptContract } from './task-agent-tool-prompt-contract';
import { TaskAgentToolPromptStub } from './task-agent-tool-prompt.stub';

describe('taskAgentToolPromptContract', () => {
  describe('valid prompts', () => {
    it('VALID: {value: "Implement the auth slice"} => parses successfully', () => {
      const result = TaskAgentToolPromptStub({ value: 'Implement the auth slice' });

      expect(taskAgentToolPromptContract.parse(result)).toBe('Implement the auth slice');
    });
  });

  describe('invalid prompts', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => taskAgentToolPromptContract.parse('')).toThrow(/too_small/u);
    });
  });
});
