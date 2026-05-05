import { AskUserQuestionStub } from '@dungeonmaster/shared/contracts';
import { mapContentItemToChatEntryTransformer } from './map-content-item-to-chat-entry-transformer';
import { mapContentItemToChatEntryTransformerProxy } from './map-content-item-to-chat-entry-transformer.proxy';

const UUID1 = '00000000-0000-4000-8000-000000000001';
const TS = '1970-01-01T00:00:00.000Z';

describe('mapContentItemToChatEntryTransformer', () => {
  describe('text items', () => {
    it('VALID: {type: "text", text: "hello"} with usage => returns assistant text entry with usage', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
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
        uuid: UUID1,
        timestamp: TS,
      });
    });

    it('VALID: {type: "text", text: "hello"} without usage => returns assistant text entry without usage', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'text', text: 'hello' },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'text',
        content: 'hello',
        uuid: UUID1,
        timestamp: TS,
      });
    });

    it('EDGE: {type: "text", text missing} => returns entry with empty content', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'text' },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'text',
        content: '',
        uuid: UUID1,
        timestamp: TS,
      });
    });

    it('EDGE: {type: "text", text has leading newlines} => trims leading whitespace from content', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'text', text: '\n\n[Phase 5: Observables]\n\nSome content' },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'text',
        content: '[Phase 5: Observables]\n\nSome content',
        uuid: UUID1,
        timestamp: TS,
      });
    });

    it('EDGE: {type: "text", text is non-string} => returns entry with empty content', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'text', text: 42 },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'text',
        content: '',
        uuid: UUID1,
        timestamp: TS,
      });
    });
  });

  describe('tool_use items', () => {
    it('VALID: {type: "tool_use", name, input} => returns tool use entry', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'tool_use', name: 'read_file', input: { path: '/test' } },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_use',
        toolName: 'read_file',
        toolInput: '{"path":"/test"}',
        uuid: UUID1,
        timestamp: TS,
      });
    });

    it('VALID: {type: "tool_use", id, name, input} => returns tool use entry with toolUseId', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
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
        uuid: UUID1,
        timestamp: TS,
      });
    });

    it('EDGE: {type: "tool_use", no id} => no toolUseId in result', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'tool_use', name: 'read_file', input: { path: '/test' } },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_use',
        toolName: 'read_file',
        toolInput: '{"path":"/test"}',
        uuid: UUID1,
        timestamp: TS,
      });
    });

    it('VALID: {type: "tool_use", AskUserQuestion with string questions} => normalizes questions to array', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
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
        uuid: UUID1,
        timestamp: TS,
      });
    });

    it('EDGE: {type: "tool_use", empty input} => returns entry with empty input object', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'tool_use', name: 'my_tool' },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_use',
        toolName: 'my_tool',
        toolInput: '{}',
        uuid: UUID1,
        timestamp: TS,
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
    it('VALID: {type: "tool_result", toolUseId, content} => returns tool result entry', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'tool_result', toolUseId: 'toolu_123', content: 'file contents' },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_result',
        toolName: 'toolu_123',
        content: 'file contents',
        uuid: UUID1,
        timestamp: TS,
      });
    });

    it('EDGE: {type: "tool_result", empty content} => returns entry with empty content', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'tool_result', toolUseId: 'toolu_456', content: '' },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_result',
        toolName: 'toolu_456',
        content: '',
        uuid: UUID1,
        timestamp: TS,
      });
    });

    it('VALID: {type: "tool_result", content is array of text items} => joins text from array', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = mapContentItemToChatEntryTransformer({
        item: {
          type: 'tool_result',
          toolUseId: 'toolu_789',
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
        uuid: UUID1,
        timestamp: TS,
      });
    });

    it('EDGE: {type: "tool_result", content array with text + image + non-object} => skips only non-objects, projects each variant', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = mapContentItemToChatEntryTransformer({
        item: {
          type: 'tool_result',
          toolUseId: 'toolu_789',
          content: [{ type: 'text', text: 'Valid text' }, { type: 'image', data: 'base64...' }, 42],
        },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_result',
        toolName: 'toolu_789',
        content: 'Valid text\n[image]',
        uuid: UUID1,
        timestamp: TS,
      });
    });

    it('EDGE: {type: "tool_result", content is non-string non-array} => falls back to empty content', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'tool_result', toolUseId: 'toolu_789', content: 42 },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_result',
        toolName: 'toolu_789',
        content: '',
        uuid: UUID1,
        timestamp: TS,
      });
    });
  });

  describe('agentId propagation', () => {
    it('VALID: {item with agentId param} => includes agentId in result', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
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
        uuid: UUID1,
        timestamp: TS,
      });
    });

    it('VALID: {item without agentId param} => no agentId in result', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'text', text: 'hello' },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'text',
        content: 'hello',
        uuid: UUID1,
        timestamp: TS,
      });
    });
  });

  describe('thinking items', () => {
    it('VALID: {type: "thinking", thinking: "reasoning text"} => returns thinking entry', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'thinking', thinking: 'Let me analyze this' },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'thinking',
        content: 'Let me analyze this',
        uuid: UUID1,
        timestamp: TS,
      });
    });

    it('VALID: {type: "thinking"} => extracts from item.thinking not item.text', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'thinking', thinking: 'thinking content', text: 'text content' },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'thinking',
        content: 'thinking content',
        uuid: UUID1,
        timestamp: TS,
      });
    });

    it('EDGE: {type: "thinking", thinking missing} => returns entry with empty content', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'thinking' },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'thinking',
        content: '',
        uuid: UUID1,
        timestamp: TS,
      });
    });
  });

  describe('model param', () => {
    it('VALID: {text item with model} => model is passed through to text entry', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
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
        uuid: UUID1,
        timestamp: TS,
      });
    });

    it('VALID: {tool_use item with model} => model is passed through to tool_use entry', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
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
        uuid: UUID1,
        timestamp: TS,
      });
    });

    it('VALID: {thinking item with model} => model is NOT on thinking entry', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'thinking', thinking: 'reasoning' },
        usage: undefined,
        model: 'claude-opus-4-6',
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'thinking',
        content: 'reasoning',
        uuid: UUID1,
        timestamp: TS,
      });
    });

    it('EDGE: {text item without model} => no model field in result', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'text', text: 'hello' },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'text',
        content: 'hello',
        uuid: UUID1,
        timestamp: TS,
      });
    });
  });

  describe('source propagation', () => {
    it('VALID: {text item with source: "session"} => includes source in result', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
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
        uuid: UUID1,
        timestamp: TS,
      });
    });

    it('VALID: {text item with source: "subagent"} => includes source in result', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
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
        uuid: UUID1,
        timestamp: TS,
      });
    });

    it('VALID: {tool_result item with source and agentId} => includes source and agentId', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'tool_result', toolUseId: 'toolu_123', content: 'data' },
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
        uuid: UUID1,
        timestamp: TS,
      });
    });
  });

  describe('tool_result isError', () => {
    it('VALID: {tool_result with isError: true} => includes isError in result', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = mapContentItemToChatEntryTransformer({
        item: {
          type: 'tool_result',
          toolUseId: 'toolu_123',
          content: 'error msg',
          isError: true,
        },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_result',
        toolName: 'toolu_123',
        content: 'error msg',
        isError: true,
        uuid: UUID1,
        timestamp: TS,
      });
    });

    it('EDGE: {tool_result with isError: false} => omits isError from result', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'tool_result', toolUseId: 'toolu_123', content: 'ok', isError: false },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_result',
        toolName: 'toolu_123',
        content: 'ok',
        uuid: UUID1,
        timestamp: TS,
      });
    });
  });

  describe('tool_use id edge cases', () => {
    it('EDGE: {tool_use with non-string id} => omits toolUseId', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = mapContentItemToChatEntryTransformer({
        item: { type: 'tool_use', id: 123, name: 'read_file', input: { path: '/test' } },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_use',
        toolName: 'read_file',
        toolInput: '{"path":"/test"}',
        uuid: UUID1,
        timestamp: TS,
      });
    });
  });

  describe('tool_result toolUseId edge cases', () => {
    it('EDGE: {tool_result with non-string toolUseId} => throws validation error', () => {
      expect(() => {
        mapContentItemToChatEntryTransformer({
          item: { type: 'tool_result', toolUseId: 123, content: 'data' },
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

      expect(result).toBe(null);
    });
  });

  // Regression guard for the production bug captured at quest ac509111-...:
  // real Claude CLI emits MCP tool_results (most visibly `ToolSearch`) with `content`
  // as an array of `tool_reference` blocks — `[{ type: 'tool_reference', tool_name: '…' }]`.
  // The Anthropic SDK's `ToolResultBlockParam.content` admits this shape exactly. The
  // transformer's array-content branch only extracts `text` fields from each item, so
  // every `tool_reference` collapses to undefined → filtered → joined to ''. The rendered
  // TOOL_ROW shows status ✓ (the result paired) but an empty body.
  //
  // The assertion here is "the tool_name strings should appear in the rendered content".
  // It currently FAILS because the transformer drops them. When the transformer learns to
  // render non-`text` array items, this test flips to passing — that's the diagnostic.
  describe('tool_result with array content — Anthropic SDK variant projections', () => {
    it('VALID: {tool_result, content: [tool_reference, tool_reference]} => joins tool_name strings', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = mapContentItemToChatEntryTransformer({
        item: {
          type: 'tool_result',
          toolUseId: 'toolu_01ToolReferenceArray',
          content: [
            { type: 'tool_reference', toolName: 'mcp__dungeonmaster__get-quest' },
            { type: 'tool_reference', toolName: 'mcp__dungeonmaster__modify-quest' },
          ],
        },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_result',
        toolName: 'toolu_01ToolReferenceArray',
        content: 'mcp__dungeonmaster__get-quest\nmcp__dungeonmaster__modify-quest',
        uuid: UUID1,
        timestamp: TS,
      });
    });

    it('VALID: {tool_result, mixed text + tool_reference content} => joins text and tool_name strings in order', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = mapContentItemToChatEntryTransformer({
        item: {
          type: 'tool_result',
          toolUseId: 'toolu_01ToolReferenceMixed',
          content: [
            { type: 'text', text: 'Found these tools:' },
            { type: 'tool_reference', toolName: 'mcp__dungeonmaster__ask-user-question' },
          ],
        },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_result',
        toolName: 'toolu_01ToolReferenceMixed',
        content: 'Found these tools:\nmcp__dungeonmaster__ask-user-question',
        uuid: UUID1,
        timestamp: TS,
      });
    });

    it('VALID: {tool_result, content: [search_result]} => renders the title', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = mapContentItemToChatEntryTransformer({
        item: {
          type: 'tool_result',
          toolUseId: 'toolu_01SearchResult',
          content: [{ type: 'search_result', title: 'Anthropic Docs', source: 'https://x' }],
        },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_result',
        toolName: 'toolu_01SearchResult',
        content: 'Anthropic Docs',
        uuid: UUID1,
        timestamp: TS,
      });
    });

    it('VALID: {tool_result, content: [image]} => renders [image] placeholder', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = mapContentItemToChatEntryTransformer({
        item: {
          type: 'tool_result',
          toolUseId: 'toolu_01Image',
          content: [{ type: 'image' }],
        },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_result',
        toolName: 'toolu_01Image',
        content: '[image]',
        uuid: UUID1,
        timestamp: TS,
      });
    });

    it('VALID: {tool_result, content: [document]} => renders [document] placeholder', () => {
      const proxy = mapContentItemToChatEntryTransformerProxy();
      proxy.setupUuids({ uuids: [UUID1] });
      const result = mapContentItemToChatEntryTransformer({
        item: {
          type: 'tool_result',
          toolUseId: 'toolu_01Document',
          content: [{ type: 'document' }],
        },
        usage: undefined,
      });

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_result',
        toolName: 'toolu_01Document',
        content: '[document]',
        uuid: UUID1,
        timestamp: TS,
      });
    });
  });
});
