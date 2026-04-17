import {
  AssistantTextChatEntryStub,
  AssistantToolUseChatEntryStub,
} from '@dungeonmaster/shared/contracts';

import { streamJsonToClarificationTransformer } from './stream-json-to-clarification-transformer';

describe('streamJsonToClarificationTransformer', () => {
  describe('valid ask-user-question tool call', () => {
    it('VALID: {assistant tool_use entry for ask-user-question} => returns questions array', () => {
      const entry = AssistantToolUseChatEntryStub({
        toolName: 'mcp__dungeonmaster__ask-user-question',
        toolInput: JSON.stringify({
          questions: [
            {
              question: 'Which database?',
              header: 'Database Choice',
              options: [
                { label: 'PostgreSQL', description: 'Relational DB' },
                { label: 'MongoDB', description: 'Document DB' },
              ],
              multiSelect: false,
            },
          ],
        }),
      } as never);

      const result = streamJsonToClarificationTransformer({ entry });

      expect(result).toStrictEqual({
        questions: [
          {
            question: 'Which database?',
            header: 'Database Choice',
            options: [
              { label: 'PostgreSQL', description: 'Relational DB' },
              { label: 'MongoDB', description: 'Document DB' },
            ],
            multiSelect: false,
          },
        ],
      });
    });

    it('VALID: {multiple questions} => returns all questions', () => {
      const entry = AssistantToolUseChatEntryStub({
        toolName: 'mcp__dungeonmaster__ask-user-question',
        toolInput: JSON.stringify({
          questions: [
            {
              question: 'Which database?',
              header: 'DB',
              options: [],
              multiSelect: false,
            },
            {
              question: 'Which framework?',
              header: 'Framework',
              options: [{ label: 'Express', description: 'Node.js' }],
              multiSelect: true,
            },
          ],
        }),
      } as never);

      const result = streamJsonToClarificationTransformer({ entry });

      expect(result).toStrictEqual({
        questions: [
          {
            question: 'Which database?',
            header: 'DB',
            options: [],
            multiSelect: false,
          },
          {
            question: 'Which framework?',
            header: 'Framework',
            options: [{ label: 'Express', description: 'Node.js' }],
            multiSelect: true,
          },
        ],
      });
    });
  });

  describe('no ask-user-question content', () => {
    it('EMPTY: {assistant text entry} => returns null', () => {
      const entry = AssistantTextChatEntryStub();

      const result = streamJsonToClarificationTransformer({ entry });

      expect(result).toBe(null);
    });

    it('EMPTY: {assistant tool_use entry with different tool name} => returns null', () => {
      const entry = AssistantToolUseChatEntryStub({
        toolName: 'Bash',
        toolInput: JSON.stringify({ command: 'ls' }),
      } as never);

      const result = streamJsonToClarificationTransformer({ entry });

      expect(result).toBe(null);
    });
  });

  describe('malformed input', () => {
    it('EMPTY: {ask-user-question with non-JSON toolInput} => returns null', () => {
      const entry = AssistantToolUseChatEntryStub({
        toolName: 'mcp__dungeonmaster__ask-user-question',
        toolInput: 'not valid json',
      } as never);

      const result = streamJsonToClarificationTransformer({ entry });

      expect(result).toBe(null);
    });

    it('EMPTY: {ask-user-question with toolInput missing questions} => returns null', () => {
      const entry = AssistantToolUseChatEntryStub({
        toolName: 'mcp__dungeonmaster__ask-user-question',
        toolInput: JSON.stringify({}),
      } as never);

      const result = streamJsonToClarificationTransformer({ entry });

      expect(result).toBe(null);
    });

    it('EMPTY: {ask-user-question with non-array questions} => returns null', () => {
      const entry = AssistantToolUseChatEntryStub({
        toolName: 'mcp__dungeonmaster__ask-user-question',
        toolInput: JSON.stringify({ questions: 'not-array' }),
      } as never);

      const result = streamJsonToClarificationTransformer({ entry });

      expect(result).toBe(null);
    });

    it('EMPTY: {ask-user-question with empty questions array} => returns null', () => {
      const entry = AssistantToolUseChatEntryStub({
        toolName: 'mcp__dungeonmaster__ask-user-question',
        toolInput: JSON.stringify({ questions: [] }),
      } as never);

      const result = streamJsonToClarificationTransformer({ entry });

      expect(result).toBe(null);
    });

    it('EMPTY: {ask-user-question with invalid question shape} => returns null', () => {
      const entry = AssistantToolUseChatEntryStub({
        toolName: 'mcp__dungeonmaster__ask-user-question',
        toolInput: JSON.stringify({ questions: [{ invalid: 'shape' }] }),
      } as never);

      const result = streamJsonToClarificationTransformer({ entry });

      expect(result).toBe(null);
    });
  });
});
