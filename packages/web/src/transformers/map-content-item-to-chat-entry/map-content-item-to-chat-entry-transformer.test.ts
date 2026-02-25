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

    it('VALID: {type: "tool_use", id, name, input} => returns tool use entry with toolUseId', () => {
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'tool_use', id: 'toolu_abc123', name: 'read_file', input: { path: '/test' } },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_use',
        toolUseId: 'toolu_abc123',
        toolName: 'read_file',
        toolInput: '{"path":"/test"}',
      });
    });

    it('EDGE: {type: "tool_use", no id} => no toolUseId in result', () => {
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'tool_use', name: 'read_file', input: { path: '/test' } },
        usage: undefined,
      });

      expect(result).not.toHaveProperty('toolUseId');
    });

    it('VALID: {type: "tool_use", AskUserQuestion with string questions} => normalizes questions to array', () => {
      const stubData = AskUserQuestionStub();

      const result = mapContentItemToChatEntryTransformer({
        item: {
          type: 'tool_use',
          name: 'mcp__dungeonmaster__ask-user-question',
          input: { questions: JSON.stringify(stubData.questions) },
        },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_use',
        toolName: 'mcp__dungeonmaster__ask-user-question',
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

    it('VALID: {type: "tool_result", content is array of text items} => joins text from array', () => {
      const result = mapContentItemToChatEntryTransformer({
        item: {
          type: 'tool_result',
          tool_use_id: 'toolu_789',
          content: [
            { type: 'text', text: 'First line' },
            { type: 'text', text: 'Second line' },
          ],
        },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_result',
        toolName: 'toolu_789',
        content: 'First line\nSecond line',
      });
    });

    it('EDGE: {type: "tool_result", content is array with non-text items} => skips non-text items', () => {
      const result = mapContentItemToChatEntryTransformer({
        item: {
          type: 'tool_result',
          tool_use_id: 'toolu_789',
          content: [{ type: 'text', text: 'Valid text' }, { type: 'image', data: 'base64...' }, 42],
        },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_result',
        toolName: 'toolu_789',
        content: 'Valid text',
      });
    });

    it('EDGE: {type: "tool_result", content is non-string non-array} => falls back to empty content', () => {
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

  describe('thinking items', () => {
    it('VALID: {type: "thinking", thinking: "reasoning text"} => returns thinking entry', () => {
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'thinking', thinking: 'Let me analyze this' },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'thinking',
        content: 'Let me analyze this',
      });
    });

    it('VALID: {type: "thinking"} => extracts from item.thinking not item.text', () => {
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'thinking', thinking: 'thinking content', text: 'text content' },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'thinking',
        content: 'thinking content',
      });
    });

    it('EDGE: {type: "thinking", thinking missing} => returns entry with empty content', () => {
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'thinking' },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'thinking',
        content: '',
      });
    });
  });

  describe('model param', () => {
    it('VALID: {text item with model} => model is passed through to text entry', () => {
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'text', text: 'hello' },
        usage: undefined,
        model: 'claude-opus-4-6',
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'text',
        content: 'hello',
        model: 'claude-opus-4-6',
      });
    });

    it('VALID: {tool_use item with model} => model is passed through to tool_use entry', () => {
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'tool_use', name: 'read_file', input: { path: '/test' } },
        usage: undefined,
        model: 'claude-sonnet-4',
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_use',
        toolName: 'read_file',
        toolInput: '{"path":"/test"}',
        model: 'claude-sonnet-4',
      });
    });

    it('VALID: {thinking item with model} => model is NOT on thinking entry', () => {
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'thinking', thinking: 'reasoning' },
        usage: undefined,
        model: 'claude-opus-4-6',
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'thinking',
        content: 'reasoning',
      });
    });

    it('EDGE: {text item without model} => no model field in result', () => {
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

  describe('source propagation', () => {
    it('VALID: {text item with source: "session"} => includes source in result', () => {
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'text', text: 'hello' },
        usage: undefined,
        source: 'session',
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'text',
        content: 'hello',
        source: 'session',
      });
    });

    it('VALID: {text item with source: "subagent"} => includes source in result', () => {
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'text', text: 'hello' },
        usage: undefined,
        source: 'subagent',
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'text',
        content: 'hello',
        source: 'subagent',
      });
    });

    it('VALID: {tool_result item with source and agentId} => includes source and agentId', () => {
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'tool_result', tool_use_id: 'toolu_123', content: 'data' },
        usage: undefined,
        source: 'subagent',
        agentId: 'agent-1',
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_result',
        toolName: 'toolu_123',
        content: 'data',
        source: 'subagent',
        agentId: 'agent-1',
      });
    });
  });

  describe('tool_result is_error', () => {
    it('VALID: {tool_result with is_error: true} => includes isError in result', () => {
      const result = mapContentItemToChatEntryTransformer({
        item: {
          type: 'tool_result',
          tool_use_id: 'toolu_123',
          content: 'error msg',
          is_error: true,
        },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_result',
        toolName: 'toolu_123',
        content: 'error msg',
        isError: true,
      });
    });

    it('EDGE: {tool_result with is_error: false} => omits isError from result', () => {
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'tool_result', tool_use_id: 'toolu_123', content: 'ok', is_error: false },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_result',
        toolName: 'toolu_123',
        content: 'ok',
      });
    });
  });

  describe('tool_use id edge cases', () => {
    it('EDGE: {tool_use with non-string id} => omits toolUseId', () => {
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'tool_use', id: 123, name: 'read_file', input: { path: '/test' } },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_use',
        toolName: 'read_file',
        toolInput: '{"path":"/test"}',
      });
    });
  });

  describe('tool_result tool_use_id edge cases', () => {
    it('EDGE: {tool_result with non-string tool_use_id} => throws validation error', () => {
      expect(() => {
        mapContentItemToChatEntryTransformer({
          item: { type: 'tool_result', tool_use_id: 123, content: 'data' },
          usage: undefined,
        });
      }).toThrow(/too_small/u);
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
