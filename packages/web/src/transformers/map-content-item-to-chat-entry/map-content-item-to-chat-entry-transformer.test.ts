import { mapContentItemToChatEntryTransformer } from './map-content-item-to-chat-entry-transformer';

describe('mapContentItemToChatEntryTransformer', () => {
  describe('text items', () => {
    it('VALID: {type: "text", text: "hello"} with usage => returns assistant text entry with usage', () => {
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'text', text: 'hello' },
        usage: {
          inputTokens: 100,
          outputTokens: 50,
          cacheCreationInputTokens: 10,
          cacheReadInputTokens: 5,
        } as never,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'text',
        content: 'hello',
        usage: {
          inputTokens: 100,
          outputTokens: 50,
          cacheCreationInputTokens: 10,
          cacheReadInputTokens: 5,
        },
      });
    });

    it('VALID: {type: "text", text: "hello"} without usage => returns assistant text entry without usage', () => {
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'text', text: 'hello' },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'text',
        content: 'hello',
      });
    });

    it('EDGE: {type: "text", text missing} => returns entry with empty content', () => {
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'text' },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'text',
        content: '',
      });
    });
  });

  describe('tool_use items', () => {
    it('VALID: {type: "tool_use", name, input} => returns tool use entry', () => {
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'tool_use', name: 'read_file', input: { path: '/test' } },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_use',
        toolName: 'read_file',
        toolInput: '{"path":"/test"}',
      });
    });

    it('EDGE: {type: "tool_use", empty input} => returns entry with empty input object', () => {
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'tool_use', name: 'my_tool' },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_use',
        toolName: 'my_tool',
        toolInput: '{}',
      });
    });
  });

  describe('tool_result items', () => {
    it('VALID: {type: "tool_result", tool_use_id, content} => returns tool result entry', () => {
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'tool_result', tool_use_id: 'toolu_123', content: 'file contents' },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_result',
        toolName: 'toolu_123',
        content: 'file contents',
      });
    });

    it('EDGE: {type: "tool_result", empty content} => returns entry with empty content', () => {
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'tool_result', tool_use_id: 'toolu_456', content: '' },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_result',
        toolName: 'toolu_456',
        content: '',
      });
    });
  });

  describe('unrecognized items', () => {
    it('EMPTY: {type: "unknown"} => returns null', () => {
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'unknown' },
        usage: undefined,
      });

      expect(result).toBeNull();
    });
  });
});
