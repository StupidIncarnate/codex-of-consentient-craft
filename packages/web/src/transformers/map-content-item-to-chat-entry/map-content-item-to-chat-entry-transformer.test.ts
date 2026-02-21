import { AskUserQuestionStub } from '../../contracts/ask-user-question/ask-user-question.stub';
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

    it('EDGE: {type: "text", text is non-string} => returns entry with empty content', () => {
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'text', text: 42 },
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

    it('VALID: {type: "tool_use", AskUserQuestion with string questions} => normalizes questions to array', () => {
      const stubData = AskUserQuestionStub();

      const result = mapContentItemToChatEntryTransformer({
        item: {
          type: 'tool_use',
          name: 'AskUserQuestion',
          input: { questions: JSON.stringify(stubData.questions) },
        },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_use',
        toolName: 'AskUserQuestion',
        toolInput: JSON.stringify({ questions: stubData.questions }),
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

    it('EDGE: {type: "tool_use", name is non-string} => falls back to empty string and throws', () => {
      expect(() => {
        mapContentItemToChatEntryTransformer({
          item: { type: 'tool_use', name: 123, input: { path: '/test' } },
          usage: undefined,
        });
      }).toThrow(/too_small/u);
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

    it('EDGE: {type: "tool_result", content is non-string} => falls back to empty content', () => {
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'tool_result', tool_use_id: 'toolu_789', content: 42 },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_result',
        toolName: 'toolu_789',
        content: '',
      });
    });
  });

  describe('agentId propagation', () => {
    it('VALID: {item with agentId param} => includes agentId in result', () => {
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'text', text: 'hello' },
        usage: undefined,
        agentId: 'agent-1',
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'text',
        content: 'hello',
        agentId: 'agent-1',
      });
    });

    it('VALID: {item without agentId param} => no agentId in result', () => {
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
