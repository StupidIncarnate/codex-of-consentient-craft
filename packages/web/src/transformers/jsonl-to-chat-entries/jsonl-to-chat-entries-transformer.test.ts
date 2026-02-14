import { jsonlToChatEntriesTransformer } from './jsonl-to-chat-entries-transformer';

describe('jsonlToChatEntriesTransformer', () => {
  describe('user entries', () => {
    it('VALID: {type: "user", string content} => returns user chat entry', () => {
      const result = jsonlToChatEntriesTransformer({
        entries: [{ type: 'user', message: { role: 'user', content: 'hello' } }],
      });

      expect(result).toStrictEqual([{ role: 'user', content: 'hello' }]);
    });

    it('VALID: {type: "user", array content with text items} => returns joined text', () => {
      const result = jsonlToChatEntriesTransformer({
        entries: [
          {
            type: 'user',
            message: {
              role: 'user',
              content: [
                { type: 'text', text: 'hello ' },
                { type: 'text', text: 'world' },
              ],
            },
          },
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
      const result = jsonlToChatEntriesTransformer({
        entries: [
          {
            type: 'assistant',
            message: {
              content: [{ type: 'text', text: 'hi there' }],
              usage: {
                input_tokens: 100,
                output_tokens: 50,
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
          {
            type: 'assistant',
            message: {
              content: [{ type: 'tool_use', name: 'read_file', input: { path: '/test' } }],
            },
          },
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
          {
            type: 'assistant',
            message: {
              content: [{ type: 'tool_result', tool_use_id: 'toolu_123', content: 'data' }],
            },
          },
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
          { type: 'user', message: { role: 'user', content: 'what is 2+2?' } },
          {
            type: 'assistant',
            message: {
              content: [{ type: 'text', text: 'The answer is 4.' }],
            },
          },
        ],
      });

      expect(result).toStrictEqual([
        { role: 'user', content: 'what is 2+2?' },
        { role: 'assistant', type: 'text', content: 'The answer is 4.' },
      ]);
    });
  });

  describe('skipped entries', () => {
    it('EDGE: {type: "result"} => skips non-user non-assistant entries', () => {
      const result = jsonlToChatEntriesTransformer({
        entries: [{ type: 'result', session_id: 'sess-123' }],
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
