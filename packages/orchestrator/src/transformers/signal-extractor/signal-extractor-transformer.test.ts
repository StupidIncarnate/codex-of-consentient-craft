import {
  AssistantTextStreamLineStub,
  AssistantToolUseStreamLineStub,
  OperationItemIdStub,
} from '@dungeonmaster/shared/contracts';
import { snakeKeysToCamelKeysTransformer } from '@dungeonmaster/shared/transformers';

import { signalExtractorTransformer } from './signal-extractor-transformer';

describe('signalExtractorTransformer', () => {
  describe('valid signal extraction', () => {
    it('VALID: {parsed with signal-back tool call, operationStatus done} => returns extracted signal', () => {
      const operationItemId = OperationItemIdStub();
      const result = signalExtractorTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
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
        }),
      });

      expect(result).toStrictEqual({
        signal: {
          signal: 'complete',
          operationItemId,
          operationStatus: 'done',
        },
      });
    });

    it('VALID: {mixed tool_use items, one signal-back with operationStatus partial} => extracts signal', () => {
      const operationItemId = OperationItemIdStub();
      const result = signalExtractorTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
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
                {
                  type: 'tool_use',
                  id: 'toolu_02SignalBack1234567890AB',
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
        }),
      });

      expect(result).toStrictEqual({
        signal: {
          signal: 'complete',
          operationItemId,
          operationStatus: 'partial',
        },
      });
    });

    it('VALID: {signal-back with only signal, no operationItemId/operationStatus} => extracts bare complete signal', () => {
      const result = signalExtractorTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: AssistantToolUseStreamLineStub({
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
                  name: 'mcp__dungeonmaster__signal-back',
                  input: { signal: 'complete' },
                },
              ],
            },
          }),
        }),
      });

      expect(result).toStrictEqual({ signal: { signal: 'complete' } });
    });
  });

  describe('no signal found', () => {
    it('EMPTY: {parsed assistant text line} => returns signal null', () => {
      const result = signalExtractorTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse(JSON.stringify(AssistantTextStreamLineStub())),
        }),
      });

      expect(result).toStrictEqual({ signal: null });
    });

    it('EMPTY: {parsed object that is not stream-json structure} => returns signal null', () => {
      const result = signalExtractorTransformer({
        parsed: snakeKeysToCamelKeysTransformer({ value: JSON.parse('{"foo":"bar"}') }),
      });

      expect(result).toStrictEqual({ signal: null });
    });

    it('EMPTY: {parsed null from non-JSON line upstream} => returns signal null', () => {
      const result = signalExtractorTransformer({ parsed: null });

      expect(result).toStrictEqual({ signal: null });
    });

    it('EMPTY: {parsed assistant tool_use without signal-back} => returns signal null', () => {
      const result = signalExtractorTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse(
            JSON.stringify(
              AssistantToolUseStreamLineStub({
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
            ),
          ),
        }),
      });

      expect(result).toStrictEqual({ signal: null });
    });
  });
});
