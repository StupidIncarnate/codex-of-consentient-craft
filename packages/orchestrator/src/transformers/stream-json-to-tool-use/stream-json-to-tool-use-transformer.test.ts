import {
  AssistantTextStreamLineStub,
  AssistantToolUseStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import { snakeKeysToCamelKeysTransformer } from '@dungeonmaster/shared/transformers';

import { streamJsonToToolUseTransformer } from './stream-json-to-tool-use-transformer';

describe('streamJsonToToolUseTransformer', () => {
  describe('valid tool_use content', () => {
    it('VALID: {assistant message with single tool_use, empty input} => returns formatted tool name', () => {
      const result = streamJsonToToolUseTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: AssistantToolUseStreamLineStub({
            message: {
              role: 'assistant',
              content: [
                { type: 'tool_use', id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ', name: 'Bash', input: {} },
              ],
            },
          }),
        }),
      });

      expect(result).toBe('[Bash]\n');
    });

    it('VALID: {assistant message with multiple tool_use, empty inputs} => returns all tool names', () => {
      const result = streamJsonToToolUseTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: AssistantToolUseStreamLineStub({
            message: {
              role: 'assistant',
              content: [
                { type: 'tool_use', id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ', name: 'Task', input: {} },
                { type: 'tool_use', id: 'toolu_02XYZ', name: 'Read', input: {} },
              ],
            },
          }),
        }),
      });

      expect(result).toBe('[Task] [Read]\n');
    });

    it('VALID: {assistant message with mixed content types} => returns only tool_use names', () => {
      const result = streamJsonToToolUseTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: AssistantToolUseStreamLineStub({
            message: {
              role: 'assistant',
              content: [
                { type: 'text', text: 'Before tool ' },
                { type: 'tool_use', id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ', name: 'Glob', input: {} },
                { type: 'text', text: 'after tool' },
              ],
            },
          }),
        }),
      });

      expect(result).toBe('[Glob]\n');
    });
  });

  describe('tool_use with input parameters', () => {
    it('VALID: {tool_use with single input param} => returns tool name with formatted input', () => {
      const result = streamJsonToToolUseTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: AssistantToolUseStreamLineStub({
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
                  name: 'Glob',
                  input: { pattern: '*.ts' },
                },
              ],
            },
          }),
        }),
      });

      expect(result).toBe('[Glob] pattern="*.ts"\n');
    });

    it('VALID: {tool_use with multiple input params} => returns tool name with formatted inputs', () => {
      const result = streamJsonToToolUseTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: AssistantToolUseStreamLineStub({
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
                  name: 'Read',
                  input: { file_path: '/path/to/file.ts' },
                },
              ],
            },
          }),
        }),
      });

      expect(result).toBe('[Read] filePath="/path/to/file.ts"\n');
    });

    it('VALID: {tool_use with priority key ordering} => respects priority order', () => {
      const result = streamJsonToToolUseTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: AssistantToolUseStreamLineStub({
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
                  name: 'Grep',
                  input: { pattern: 'TODO', path: 'src/', output_mode: 'content' },
                },
              ],
            },
          }),
        }),
      });

      // path should come before pattern in priority order
      expect(result).toBe('[Grep] path="src/" pattern="TODO" outputMode="content"\n');
    });

    it('VALID: {tool_use with more than maxParams} => truncates with ellipsis', () => {
      const result = streamJsonToToolUseTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse(
            '{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Task","input":{"a":"1","b":"2","c":"3","d":"4"}}]}}',
          ),
        }),
      });

      expect(result).toBe('[Task] a="1" b="2" c="3" ...\n');
    });

    it('VALID: {multiple tools with inputs} => formats each tool with its inputs', () => {
      const result = streamJsonToToolUseTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: AssistantToolUseStreamLineStub({
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
                  name: 'Glob',
                  input: { pattern: '*.ts' },
                },
                {
                  type: 'tool_use',
                  id: 'toolu_02XYZ',
                  name: 'Read',
                  input: { file_path: '/test.ts' },
                },
              ],
            },
          }),
        }),
      });

      expect(result).toBe('[Glob] pattern="*.ts" [Read] filePath="/test.ts"\n');
    });

    it('VALID: {tool_use with missing input property} => returns tool name only', () => {
      const result = streamJsonToToolUseTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse(
            '{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Task"}]}}',
          ),
        }),
      });

      expect(result).toBe('[Task]\n');
    });

    it('VALID: {tool_use with null input} => returns tool name only', () => {
      const result = streamJsonToToolUseTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse(
            '{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Task","input":null}]}}',
          ),
        }),
      });

      expect(result).toBe('[Task]\n');
    });

    it('VALID: {tool_use with array input} => returns tool name only', () => {
      const result = streamJsonToToolUseTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse(
            '{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Task","input":["a","b"]}]}}',
          ),
        }),
      });

      expect(result).toBe('[Task]\n');
    });
  });

  describe('no tool_use content', () => {
    it('EMPTY: {assistant message with only text} => returns null', () => {
      const result = streamJsonToToolUseTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: AssistantTextStreamLineStub(),
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {assistant message with only thinking block} => returns null', () => {
      const result = streamJsonToToolUseTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse(
            '{"type":"assistant","message":{"content":[{"type":"thinking","thinking":"Let me reason."}]}}',
          ),
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {assistant message with only redacted_thinking block} => returns null', () => {
      const result = streamJsonToToolUseTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse(
            '{"type":"assistant","message":{"content":[{"type":"redacted_thinking","data":"<blob>"}]}}',
          ),
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {assistant message with empty content array} => returns null', () => {
      const result = streamJsonToToolUseTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('{"type":"assistant","message":{"content":[]}}'),
        }),
      });

      expect(result).toBe(null);
    });
  });

  describe('non-assistant messages', () => {
    it('EMPTY: {init message type} => returns null', () => {
      const result = streamJsonToToolUseTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('{"type":"init","session_id":"abc-123"}'),
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {result message type} => returns null', () => {
      const result = streamJsonToToolUseTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('{"type":"result","data":{}}'),
        }),
      });

      expect(result).toBe(null);
    });
  });

  describe('malformed input', () => {
    it('EMPTY: {invalid JSON} => returns null', () => {
      const result = streamJsonToToolUseTransformer({ parsed: null });

      expect(result).toBe(null);
    });

    it('EMPTY: {missing message property} => returns null', () => {
      const result = streamJsonToToolUseTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('{"type":"assistant"}'),
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {missing content property} => returns null', () => {
      const result = streamJsonToToolUseTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('{"type":"assistant","message":{}}'),
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {content is not array} => returns null', () => {
      const result = streamJsonToToolUseTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse('{"type":"assistant","message":{"content":"not an array"}}'),
        }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {tool_use without name property} => returns null', () => {
      const result = streamJsonToToolUseTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse(
            '{"type":"assistant","message":{"content":[{"type":"tool_use","input":{}}]}}',
          ),
        }),
      });

      expect(result).toBe(null);
    });
  });
});
