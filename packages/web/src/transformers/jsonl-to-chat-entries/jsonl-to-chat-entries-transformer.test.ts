import {
  AssistantTextStreamLineStub,
  AssistantToolResultStreamLineStub,
  AssistantToolUseStreamLineStub,
  ResultStreamLineStub,
  UserTextArrayStreamLineStub,
  UserTextStringStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import { jsonlToChatEntriesTransformer } from './jsonl-to-chat-entries-transformer';

describe('jsonlToChatEntriesTransformer', () => {
  describe('user entries', () => {
    it('VALID: {type: "user", string content} => returns user chat entry', () => {
      const result = jsonlToChatEntriesTransformer({
        entries: [UserTextStringStreamLineStub({ message: { role: 'user', content: 'hello' } })],
      });

      expect(result).toStrictEqual([{ role: 'user', content: 'hello' }]);
    });

    it('VALID: {type: "user", array content with text items} => returns joined text', () => {
      const result = jsonlToChatEntriesTransformer({
        entries: [
          UserTextArrayStreamLineStub({
            message: {
              role: 'user',
              content: [
                { type: 'text', text: 'hello ' },
                { type: 'text', text: 'world' },
              ],
            },
          }),
        ],
      });

      expect(result).toStrictEqual([{ role: 'user', content: 'hello world' }]);
    });

    it('EDGE: {type: "user", array content with non-text items} => skips non-text items', () => {
      const result = jsonlToChatEntriesTransformer({
        entries: [
          {
            type: 'user',
            message: {
              role: 'user',
              content: [
                { type: 'text', text: 'hello' },
                { type: 'image', source: 'data:image' },
              ],
            },
          },
        ],
      });

      expect(result).toStrictEqual([{ role: 'user', content: 'hello' }]);
    });

    it('EDGE: {type: "user", empty string content} => skips entry', () => {
      const result = jsonlToChatEntriesTransformer({
        entries: [{ type: 'user', message: { role: 'user', content: '' } }],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('assistant entries', () => {
    it('VALID: {type: "assistant", text content with usage} => returns text entry with usage', () => {
      const stub = AssistantTextStreamLineStub({
        message: {
          role: 'assistant',
          content: [{ type: 'text', text: 'hi there' }],
          usage: { input_tokens: 100, output_tokens: 50 },
        },
      });
      const result = jsonlToChatEntriesTransformer({
        entries: [
          {
            ...stub,
            message: {
              ...stub.message,
              usage: {
                ...stub.message.usage,
                cache_creation_input_tokens: 10,
                cache_read_input_tokens: 5,
              },
            },
          },
        ],
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'text',
          content: 'hi there',
          usage: {
            inputTokens: 100,
            outputTokens: 50,
            cacheCreationInputTokens: 10,
            cacheReadInputTokens: 5,
          },
        },
      ]);
    });

    it('VALID: {type: "assistant", tool_use content} => returns tool use entry', () => {
      const result = jsonlToChatEntriesTransformer({
        entries: [
          AssistantToolUseStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'tool_use', name: 'read_file', input: { path: '/test' } }],
            },
          }),
        ],
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_use',
          toolName: 'read_file',
          toolInput: '{"path":"/test"}',
        },
      ]);
    });

    it('VALID: {type: "assistant", tool_result content} => returns tool result entry', () => {
      const result = jsonlToChatEntriesTransformer({
        entries: [
          AssistantToolResultStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'tool_result', tool_use_id: 'toolu_123', content: 'data' }],
            },
          }),
        ],
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_result',
          toolName: 'toolu_123',
          content: 'data',
        },
      ]);
    });
  });

  describe('mixed entries', () => {
    it('VALID: {user + assistant entries} => returns all entries in order', () => {
      const result = jsonlToChatEntriesTransformer({
        entries: [
          UserTextStringStreamLineStub({
            message: { role: 'user', content: 'what is 2+2?' },
          }),
          AssistantTextStreamLineStub({
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: 'The answer is 4.' }],
            },
          }),
        ],
      });

      expect(result).toStrictEqual([
        { role: 'user', content: 'what is 2+2?' },
        { role: 'assistant', type: 'text', content: 'The answer is 4.' },
      ]);
    });
  });

  describe('agentId propagation', () => {
    it('VALID: {entry with agentId} => propagates agentId to ChatEntry', () => {
      const result = jsonlToChatEntriesTransformer({
        entries: [
          {
            ...UserTextStringStreamLineStub({ message: { role: 'user', content: 'hello' } }),
            agentId: 'agent-1',
          },
        ],
      });

      expect(result).toStrictEqual([{ role: 'user', content: 'hello', agentId: 'agent-1' }]);
    });

    it('VALID: {entry without agentId} => ChatEntry has no agentId', () => {
      const result = jsonlToChatEntriesTransformer({
        entries: [UserTextStringStreamLineStub({ message: { role: 'user', content: 'hello' } })],
      });

      expect(result).toStrictEqual([{ role: 'user', content: 'hello' }]);
    });

    it('VALID: {assistant entry with agentId} => propagates to tool_use entries', () => {
      const result = jsonlToChatEntriesTransformer({
        entries: [
          {
            ...AssistantToolUseStreamLineStub({
              message: {
                role: 'assistant',
                content: [{ type: 'tool_use', name: 'read_file', input: { path: '/test' } }],
              },
            }),
            agentId: 'agent-2',
          },
        ],
      });

      expect(result).toStrictEqual([
        {
          role: 'assistant',
          type: 'tool_use',
          toolName: 'read_file',
          toolInput: '{"path":"/test"}',
          agentId: 'agent-2',
        },
      ]);
    });
  });

  describe('skipped entries', () => {
    it('EDGE: {type: "result"} => skips non-user non-assistant entries', () => {
      const result = jsonlToChatEntriesTransformer({
        entries: [ResultStreamLineStub({ session_id: 'sess-123' })],
      });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {no type field} => skips entries without type', () => {
      const result = jsonlToChatEntriesTransformer({
        entries: [{ data: 'something' }],
      });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {type: "assistant", no message} => skips entry', () => {
      const result = jsonlToChatEntriesTransformer({
        entries: [{ type: 'assistant' }],
      });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {type: "user", no message} => skips entry', () => {
      const result = jsonlToChatEntriesTransformer({
        entries: [{ type: 'user' }],
      });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {empty array} => returns empty array', () => {
      const result = jsonlToChatEntriesTransformer({ entries: [] });

      expect(result).toStrictEqual([]);
    });
  });
});
