import { streamJsonToToolUseTransformer } from './stream-json-to-tool-use-transformer';
import { StreamJsonLineStub } from '../../contracts/stream-json-line/stream-json-line.stub';

describe('streamJsonToToolUseTransformer', () => {
  describe('valid tool_use content', () => {
    it('VALID: {assistant message with single tool_use} => returns formatted tool name', () => {
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

    it('VALID: {assistant message with multiple tool_use} => returns all tool names', () => {
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
