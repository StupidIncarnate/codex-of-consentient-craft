import {
  AssistantTextStreamLineStub,
  AssistantToolUseStreamLineStub,
} from '@dungeonmaster/shared/contracts';

import { StreamJsonLineStub } from '../../contracts/stream-json-line/stream-json-line.stub';
import { streamJsonToClarificationTransformer } from './stream-json-to-clarification-transformer';

describe('streamJsonToClarificationTransformer', () => {
  describe('valid ask-user-question tool call', () => {
    it('VALID: {assistant message with ask-user-question tool_use} => returns questions array', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify(
          AssistantToolUseStreamLineStub({
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
                  name: 'mcp__dungeonmaster__ask-user-question',
                  input: {
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
                  },
                },
              ],
            },
          }),
        ),
      });

      const result = streamJsonToClarificationTransformer({ line });

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
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [
              {
                type: 'tool_use',
                name: 'mcp__dungeonmaster__ask-user-question',
                input: {
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
                },
              },
            ],
          },
        }),
      });

      const result = streamJsonToClarificationTransformer({ line });

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

    it('VALID: {mixed content with ask-user-question} => returns questions from tool call', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [
              { type: 'text', text: 'I need some clarification.' },
              {
                type: 'tool_use',
                name: 'mcp__dungeonmaster__ask-user-question',
                input: {
                  questions: [
                    {
                      question: 'Pick one',
                      header: 'Choice',
                      options: [{ label: 'A', description: 'First' }],
                      multiSelect: false,
                    },
                  ],
                },
              },
            ],
          },
        }),
      });

      const result = streamJsonToClarificationTransformer({ line });

      expect(result).toStrictEqual({
        questions: [
          {
            question: 'Pick one',
            header: 'Choice',
            options: [{ label: 'A', description: 'First' }],
            multiSelect: false,
          },
        ],
      });
    });
  });

  describe('no ask-user-question content', () => {
    it('EMPTY: {assistant message with only text} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify(AssistantTextStreamLineStub()),
      });

      const result = streamJsonToClarificationTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {assistant message with different tool_use} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify(
          AssistantToolUseStreamLineStub({
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
                  name: 'Bash',
                  input: { command: 'ls' },
                },
              ],
            },
          }),
        ),
      });

      const result = streamJsonToClarificationTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {empty content array} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: { content: [] },
        }),
      });

      const result = streamJsonToClarificationTransformer({ line });

      expect(result).toBeNull();
    });
  });

  describe('non-assistant messages', () => {
    it('EMPTY: {init message type} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({ type: 'init', session_id: 'abc-123' }),
      });

      const result = streamJsonToClarificationTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {result message type} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({ type: 'result', data: {} }),
      });

      const result = streamJsonToClarificationTransformer({ line });

      expect(result).toBeNull();
    });
  });

  describe('malformed input', () => {
    it('EMPTY: {invalid JSON} => returns null', () => {
      const line = StreamJsonLineStub({ value: 'not valid json' });

      const result = streamJsonToClarificationTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {missing message property} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({ type: 'assistant' }),
      });

      const result = streamJsonToClarificationTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {missing content property} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({ type: 'assistant', message: {} }),
      });

      const result = streamJsonToClarificationTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {content is not array} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: { content: 'not an array' },
        }),
      });

      const result = streamJsonToClarificationTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {ask-user-question with missing input} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'tool_use', name: 'mcp__dungeonmaster__ask-user-question' }],
          },
        }),
      });

      const result = streamJsonToClarificationTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {ask-user-question with missing questions} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [
              {
                type: 'tool_use',
                name: 'mcp__dungeonmaster__ask-user-question',
                input: {},
              },
            ],
          },
        }),
      });

      const result = streamJsonToClarificationTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {ask-user-question with non-array questions} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [
              {
                type: 'tool_use',
                name: 'mcp__dungeonmaster__ask-user-question',
                input: { questions: 'not-array' },
              },
            ],
          },
        }),
      });

      const result = streamJsonToClarificationTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {ask-user-question with empty questions array} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [
              {
                type: 'tool_use',
                name: 'mcp__dungeonmaster__ask-user-question',
                input: { questions: [] },
              },
            ],
          },
        }),
      });

      const result = streamJsonToClarificationTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {ask-user-question with invalid question shape} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [
              {
                type: 'tool_use',
                name: 'mcp__dungeonmaster__ask-user-question',
                input: {
                  questions: [{ invalid: 'shape' }],
                },
              },
            ],
          },
        }),
      });

      const result = streamJsonToClarificationTransformer({ line });

      expect(result).toBeNull();
    });
  });
});
