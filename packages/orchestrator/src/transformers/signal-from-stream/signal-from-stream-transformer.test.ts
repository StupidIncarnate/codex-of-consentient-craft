import {
  AssistantTextStreamLineStub,
  AssistantToolUseStreamLineStub,
  OperationItemIdStub,
} from '@dungeonmaster/shared/contracts';
import { snakeKeysToCamelKeysTransformer } from '@dungeonmaster/shared/transformers';

import { signalFromStreamTransformer } from './signal-from-stream-transformer';

describe('signalFromStreamTransformer', () => {
  describe('valid signal extraction', () => {
    it('VALID: {signal-back tool call, operationStatus done} => returns StreamSignal', () => {
      const operationItemId = OperationItemIdStub();
      const parsed = snakeKeysToCamelKeysTransformer({
        value: AssistantToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
                name: 'mcp__dungeonmaster__signal-back',
                input: {
                  signal: 'complete',
                  operationItemId,
                  operationStatus: 'done',
                },
              },
            ],
          },
        }),
      });

      const result = signalFromStreamTransformer({ parsed });

      expect(result).toStrictEqual({
        signal: 'complete',
        operationItemId,
        operationStatus: 'done',
      });
    });

    it('VALID: {signal-back tool call, operationStatus partial} => returns StreamSignal', () => {
      const operationItemId = OperationItemIdStub();
      const parsed = snakeKeysToCamelKeysTransformer({
        value: AssistantToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
                name: 'mcp__dungeonmaster__signal-back',
                input: {
                  signal: 'complete',
                  operationItemId,
                  operationStatus: 'partial',
                },
              },
            ],
          },
        }),
      });

      const result = signalFromStreamTransformer({ parsed });

      expect(result).toStrictEqual({
        signal: 'complete',
        operationItemId,
        operationStatus: 'partial',
      });
    });

    it('VALID: {text then signal-back tool call} => returns first signal', () => {
      const operationItemId = OperationItemIdStub();
      const parsed = snakeKeysToCamelKeysTransformer({
        value: AssistantToolUseStreamLineStub({
          message: {
            role: 'assistant',
            content: [
              { type: 'text', text: 'Some text' },
              {
                type: 'tool_use',
                id: 'toolu_02SignalBack1234567890AB',
                name: 'mcp__dungeonmaster__signal-back',
                input: {
                  signal: 'complete',
                  operationItemId,
                  operationStatus: 'done',
                },
              },
            ],
          },
        }),
      });

      const result = signalFromStreamTransformer({ parsed });

      expect(result).toStrictEqual({
        signal: 'complete',
        operationItemId,
        operationStatus: 'done',
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
