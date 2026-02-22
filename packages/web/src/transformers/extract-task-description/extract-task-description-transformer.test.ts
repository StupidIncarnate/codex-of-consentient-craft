import {
  TaskToolUseChatEntryStub,
  UserChatEntryStub,
} from '../../contracts/chat-entry/chat-entry.stub';
import { extractTaskDescriptionTransformer } from './extract-task-description-transformer';

describe('extractTaskDescriptionTransformer', () => {
  describe('valid input', () => {
    it('VALID: {toolInput with description field} => returns description', () => {
      const entry = TaskToolUseChatEntryStub({
        toolInput: JSON.stringify({ description: 'Run the test suite', prompt: 'Execute tests' }),
      });

      const result = extractTaskDescriptionTransformer({ entry });

      expect(result).toBe('Run the test suite');
    });

    it('VALID: {toolInput with empty description} => returns fallback', () => {
      const entry = TaskToolUseChatEntryStub({
        toolInput: JSON.stringify({ description: '', prompt: 'Do something' }),
      });

      const result = extractTaskDescriptionTransformer({ entry });

      expect(result).toBe('Sub-agent task');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {invalid JSON toolInput} => returns fallback "Sub-agent task"', () => {
      const entry = TaskToolUseChatEntryStub({
        toolInput: 'not-valid-json{{{',
      });

      const result = extractTaskDescriptionTransformer({ entry });

      expect(result).toBe('Sub-agent task');
    });

    it('EDGE: {toolInput without description field} => returns fallback', () => {
      const entry = TaskToolUseChatEntryStub({
        toolInput: JSON.stringify({ prompt: 'Do something' }),
      });

      const result = extractTaskDescriptionTransformer({ entry });

      expect(result).toBe('Sub-agent task');
    });

    it('EDGE: {non-tool entry} => returns fallback', () => {
      const entry = UserChatEntryStub();

      const result = extractTaskDescriptionTransformer({ entry });

      expect(result).toBe('Sub-agent task');
    });
  });
});
