import { streamJsonToToolUseTransformer } from './stream-json-to-tool-use-transformer';
import { StreamJsonLineStub } from '../../contracts/stream-json-line/stream-json-line.stub';

describe('streamJsonToToolUseTransformer', () => {
  describe('valid tool_use content', () => {
    it('VALID: {assistant message with single tool_use, empty input} => returns formatted tool name', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'tool_use', name: 'mcp__dungeonmaster__discover', input: {} }],
          },
        }),
      });

      const result = streamJsonToToolUseTransformer({ line });

      expect(result).toBe('[mcp__dungeonmaster__discover]\n');
    });

    it('VALID: {assistant message with multiple tool_use, empty inputs} => returns all tool names', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [
              { type: 'tool_use', name: 'Task', input: {} },
              { type: 'tool_use', name: 'Read', input: {} },
            ],
          },
        }),
      });

      const result = streamJsonToToolUseTransformer({ line });

      expect(result).toBe('[Task] [Read]\n');
    });

    it('VALID: {assistant message with mixed content types} => returns only tool_use names', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [
              { type: 'text', text: 'Before tool ' },
              { type: 'tool_use', name: 'Glob', input: {} },
              { type: 'text', text: 'after tool' },
            ],
          },
        }),
      });

      const result = streamJsonToToolUseTransformer({ line });

      expect(result).toBe('[Glob]\n');
    });
  });

  describe('tool_use with input parameters', () => {
    it('VALID: {tool_use with single input param} => returns tool name with formatted input', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'tool_use', name: 'Glob', input: { pattern: '*.ts' } }],
          },
        }),
      });

      const result = streamJsonToToolUseTransformer({ line });

      expect(result).toBe('[Glob] pattern="*.ts"\n');
    });

    it('VALID: {tool_use with multiple input params} => returns tool name with formatted inputs', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'tool_use', name: 'Read', input: { file_path: '/path/to/file.ts' } }],
          },
        }),
      });

      const result = streamJsonToToolUseTransformer({ line });

      expect(result).toBe('[Read] file_path="/path/to/file.ts"\n');
    });

    it('VALID: {tool_use with priority key ordering} => respects priority order', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [
              {
                type: 'tool_use',
                name: 'Grep',
                input: { pattern: 'TODO', path: 'src/', output_mode: 'content' },
              },
            ],
          },
        }),
      });

      const result = streamJsonToToolUseTransformer({ line });

      // path should come before pattern in priority order
      expect(result).toBe('[Grep] path="src/" pattern="TODO" output_mode="content"\n');
    });

    it('VALID: {tool_use with more than maxParams} => truncates with ellipsis', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [
              {
                type: 'tool_use',
                name: 'Task',
                input: { a: '1', b: '2', c: '3', d: '4' },
              },
            ],
          },
        }),
      });

      const result = streamJsonToToolUseTransformer({ line });

      expect(result).toBe('[Task] a="1" b="2" c="3" ...\n');
    });

    it('VALID: {multiple tools with inputs} => formats each tool with its inputs', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [
              { type: 'tool_use', name: 'Glob', input: { pattern: '*.ts' } },
              { type: 'tool_use', name: 'Read', input: { file_path: '/test.ts' } },
            ],
          },
        }),
      });

      const result = streamJsonToToolUseTransformer({ line });

      expect(result).toBe('[Glob] pattern="*.ts" [Read] file_path="/test.ts"\n');
    });

    it('VALID: {tool_use with missing input property} => returns tool name only', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'tool_use', name: 'Task' }],
          },
        }),
      });

      const result = streamJsonToToolUseTransformer({ line });

      expect(result).toBe('[Task]\n');
    });

    it('VALID: {tool_use with null input} => returns tool name only', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'tool_use', name: 'Task', input: null }],
          },
        }),
      });

      const result = streamJsonToToolUseTransformer({ line });

      expect(result).toBe('[Task]\n');
    });

    it('VALID: {tool_use with array input} => returns tool name only', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'tool_use', name: 'Task', input: ['a', 'b'] }],
          },
        }),
      });

      const result = streamJsonToToolUseTransformer({ line });

      expect(result).toBe('[Task]\n');
    });
  });

  describe('no tool_use content', () => {
    it('EMPTY: {assistant message with only text} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'text', text: 'Hello from Claude' }],
          },
        }),
      });

      const result = streamJsonToToolUseTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {assistant message with empty content array} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [],
          },
        }),
      });

      const result = streamJsonToToolUseTransformer({ line });

      expect(result).toBeNull();
    });
  });

  describe('non-assistant messages', () => {
    it('EMPTY: {init message type} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'init',
          session_id: 'abc-123',
        }),
      });

      const result = streamJsonToToolUseTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {result message type} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'result',
          data: {},
        }),
      });

      const result = streamJsonToToolUseTransformer({ line });

      expect(result).toBeNull();
    });
  });

  describe('malformed input', () => {
    it('EMPTY: {invalid JSON} => returns null', () => {
      const line = StreamJsonLineStub({ value: 'not valid json' });

      const result = streamJsonToToolUseTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {missing message property} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
        }),
      });

      const result = streamJsonToToolUseTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {missing content property} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {},
        }),
      });

      const result = streamJsonToToolUseTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {content is not array} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: 'not an array',
          },
        }),
      });

      const result = streamJsonToToolUseTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {tool_use without name property} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [{ type: 'tool_use', input: {} }],
          },
        }),
      });

      const result = streamJsonToToolUseTransformer({ line });

      expect(result).toBeNull();
    });
  });
});
