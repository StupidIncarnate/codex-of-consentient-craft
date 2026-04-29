import {
  AssistantTextStreamLineStub,
  AssistantToolUseStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import { snakeKeysToCamelKeysTransformer } from '@dungeonmaster/shared/transformers';

import { signalFromStreamTransformer } from './signal-from-stream-transformer';

describe('signalFromStreamTransformer', () => {
  describe('valid signal extraction', () => {
    it('VALID: {assistant message with signal-back tool call} => returns StreamSignal', () => {
      const parsed = snakeKeysToCamelKeysTransformer({
        value: JSON.parse(
          JSON.stringify({
            type: 'assistant',
            message: {
              content: [
                {
                  type: 'tool_use',
                  name: 'mcp__dungeonmaster__signal-back',
                  input: {
                    signal: 'complete',
                    summary: 'Task completed',
                  },
                },
              ],
            },
          }),
        ),
      });

      const result = signalFromStreamTransformer({ parsed });

      expect(result).toStrictEqual({
        signal: 'complete',
        summary: 'Task completed',
      });
    });

    it('VALID: {failed signal} => returns StreamSignal with summary', () => {
      const parsed = snakeKeysToCamelKeysTransformer({
        value: JSON.parse(
          JSON.stringify({
            type: 'assistant',
            message: {
              content: [
                {
                  type: 'tool_use',
                  name: 'mcp__dungeonmaster__signal-back',
                  input: {
                    signal: 'failed',
                    summary: 'Tests failing in user-fetch-broker',
                  },
                },
              ],
            },
          }),
        ),
      });

      const result = signalFromStreamTransformer({ parsed });

      expect(result).toStrictEqual({
        signal: 'failed',
        summary: 'Tests failing in user-fetch-broker',
      });
    });

    it('VALID: {multiple tool calls with signal-back} => returns first signal', () => {
      const parsed = snakeKeysToCamelKeysTransformer({
        value: JSON.parse(
          JSON.stringify({
            type: 'assistant',
            message: {
              content: [
                { type: 'text', text: 'Some text' },
                {
                  type: 'tool_use',
                  name: 'mcp__dungeonmaster__signal-back',
                  input: {
                    signal: 'complete',
                    summary: 'Done',
                  },
                },
              ],
            },
          }),
        ),
      });

      const result = signalFromStreamTransformer({ parsed });

      expect(result).toStrictEqual({
        signal: 'complete',
        summary: 'Done',
      });
    });
  });

  describe('no signal found', () => {
    it('EMPTY: {JSON null value} => returns null', () => {
      const result = signalFromStreamTransformer({
        parsed: snakeKeysToCamelKeysTransformer({ value: JSON.parse('null') }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {JSON primitive string} => returns null', () => {
      const result = signalFromStreamTransformer({
        parsed: snakeKeysToCamelKeysTransformer({ value: JSON.parse('"just a string"') }),
      });

      expect(result).toBe(null);
    });

    it('EMPTY: {object without type property} => returns null', () => {
      const parsed = snakeKeysToCamelKeysTransformer({
        value: JSON.parse(
          JSON.stringify({
            message: { content: [] },
          }),
        ),
      });

      const result = signalFromStreamTransformer({ parsed });

      expect(result).toBe(null);
    });

    it('EMPTY: {non-assistant message} => returns null', () => {
      const parsed = snakeKeysToCamelKeysTransformer({
        value: JSON.parse(
          JSON.stringify({
            type: 'system',
            message: 'Hello',
          }),
        ),
      });

      const result = signalFromStreamTransformer({ parsed });

      expect(result).toBe(null);
    });

    it('EMPTY: {assistant message without tool calls} => returns null', () => {
      const parsed = snakeKeysToCamelKeysTransformer({
        value: AssistantTextStreamLineStub(),
      });

      const result = signalFromStreamTransformer({ parsed });

      expect(result).toBe(null);
    });

    it('EMPTY: {different MCP tool call} => returns null', () => {
      const parsed = snakeKeysToCamelKeysTransformer({
        value: AssistantToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
                name: 'mcp__dungeonmaster__other-tool',
                input: { foo: 'bar' },
              },
            ],
          },
        }),
      });

      const result = signalFromStreamTransformer({ parsed });

      expect(result).toBe(null);
    });

    it('EMPTY: {assistant message with no content property} => returns null', () => {
      const parsed = snakeKeysToCamelKeysTransformer({
        value: JSON.parse(
          JSON.stringify({
            type: 'assistant',
            message: {},
          }),
        ),
      });

      const result = signalFromStreamTransformer({ parsed });

      expect(result).toBe(null);
    });

    it('EMPTY: {assistant message with null message} => returns null', () => {
      const parsed = snakeKeysToCamelKeysTransformer({
        value: JSON.parse(
          JSON.stringify({
            type: 'assistant',
            message: null,
          }),
        ),
      });

      const result = signalFromStreamTransformer({ parsed });

      expect(result).toBe(null);
    });

    it('EMPTY: {assistant without message property} => returns null', () => {
      const parsed = snakeKeysToCamelKeysTransformer({
        value: JSON.parse(
          JSON.stringify({
            type: 'assistant',
          }),
        ),
      });

      const result = signalFromStreamTransformer({ parsed });

      expect(result).toBe(null);
    });

    it('EMPTY: {assistant message with empty content array} => returns null', () => {
      const parsed = snakeKeysToCamelKeysTransformer({
        value: JSON.parse(
          JSON.stringify({
            type: 'assistant',
            message: {
              content: [],
            },
          }),
        ),
      });

      const result = signalFromStreamTransformer({ parsed });

      expect(result).toBe(null);
    });

    it('EMPTY: {assistant message with non-array content} => returns null', () => {
      const parsed = snakeKeysToCamelKeysTransformer({
        value: JSON.parse(
          JSON.stringify({
            type: 'assistant',
            message: {
              content: 'not an array',
            },
          }),
        ),
      });

      const result = signalFromStreamTransformer({ parsed });

      expect(result).toBe(null);
    });

    it('EMPTY: {signal-back with invalid input} => returns null', () => {
      const parsed = snakeKeysToCamelKeysTransformer({
        value: JSON.parse(
          JSON.stringify({
            type: 'assistant',
            message: {
              content: [
                {
                  type: 'tool_use',
                  name: 'mcp__dungeonmaster__signal-back',
                  input: {
                    signal: 'invalid-signal-type',
                  },
                },
              ],
            },
          }),
        ),
      });

      const result = signalFromStreamTransformer({ parsed });

      expect(result).toBe(null);
    });

    it('EMPTY: {signal-back tool use without input property} => returns null', () => {
      const parsed = snakeKeysToCamelKeysTransformer({
        value: JSON.parse(
          JSON.stringify({
            type: 'assistant',
            message: {
              content: [
                {
                  type: 'tool_use',
                  name: 'mcp__dungeonmaster__signal-back',
                },
              ],
            },
          }),
        ),
      });

      const result = signalFromStreamTransformer({ parsed });

      expect(result).toBe(null);
    });
  });

  describe('invalid JSON handling', () => {
    it('ERROR: {invalid JSON parse failure yields null} => returns null', () => {
      const result = signalFromStreamTransformer({ parsed: null });

      expect(result).toBe(null);
    });

    it('ERROR: {truncated JSON parse failure yields null} => returns null', () => {
      const result = signalFromStreamTransformer({ parsed: null });

      expect(result).toBe(null);
    });
  });
});
