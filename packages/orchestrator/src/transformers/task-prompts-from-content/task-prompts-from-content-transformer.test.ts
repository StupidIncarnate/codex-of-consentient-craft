import { AssistantTaskToolUseStreamLineStub } from '@dungeonmaster/shared/contracts';

import { taskPromptsFromContentTransformer } from './task-prompts-from-content-transformer';

describe('taskPromptsFromContentTransformer', () => {
  describe('Task/Agent prompt extraction', () => {
    it('VALID: {assistant Agent tool_use with prompt} => returns the toolUseId and prompt', () => {
      const entry = AssistantTaskToolUseStreamLineStub({
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'toolu_01PromptExtract1',
              name: 'Agent',
              input: { description: 'agent-A', prompt: 'do slice A' },
            },
          ],
        },
      });

      const result = taskPromptsFromContentTransformer({ entry });

      expect(result).toStrictEqual([{ toolUseId: 'toolu_01PromptExtract1', prompt: 'do slice A' }]);
    });

    it('VALID: {two Task tool_use items} => returns a pair per Task in order', () => {
      const entry = AssistantTaskToolUseStreamLineStub({
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'toolu_01First',
              name: 'Task',
              input: { description: 'first', prompt: 'prompt one' },
            },
            {
              type: 'tool_use',
              id: 'toolu_01Second',
              name: 'Agent',
              input: { description: 'second', prompt: 'prompt two' },
            },
          ],
        },
      });

      const result = taskPromptsFromContentTransformer({ entry });

      expect(result).toStrictEqual([
        { toolUseId: 'toolu_01First', prompt: 'prompt one' },
        { toolUseId: 'toolu_01Second', prompt: 'prompt two' },
      ]);
    });

    it('EMPTY: {non-Task tool_use item} => returns empty array', () => {
      const entry = AssistantTaskToolUseStreamLineStub({
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'toolu_01Read',
              name: 'Read',
              input: { file_path: '/x' },
            },
          ],
        },
      });

      const result = taskPromptsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {Task tool_use whose input lacks a prompt} => skips it', () => {
      const entry = AssistantTaskToolUseStreamLineStub({
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'toolu_01NoPrompt',
              name: 'Agent',
              input: { description: 'missing prompt' },
            },
          ],
        },
      });

      const result = taskPromptsFromContentTransformer({ entry });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {entry is not a valid stream line} => returns empty array', () => {
      const result = taskPromptsFromContentTransformer({ entry: { not: 'a line' } });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {assistant line with non-array content} => returns empty array', () => {
      const result = taskPromptsFromContentTransformer({
        entry: { type: 'assistant', message: { role: 'assistant', content: 'plain text' } },
      });

      expect(result).toStrictEqual([]);
    });
  });
});
