import {
  AssistantTextStreamLineStub,
  AssistantToolUseStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import { snakeKeysToCamelKeysTransformer } from '@dungeonmaster/shared/transformers';

import { signalExtractorTransformer } from './signal-extractor-transformer';

describe('signalExtractorTransformer', () => {
  describe('valid signal extraction', () => {
    it('VALID: {parsed with signal-back tool call} => returns extracted signal', () => {
      const result = signalExtractorTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
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
        }),
      });

      expect(result).toStrictEqual({
        signal: {
          signal: 'complete',
          summary: 'Task completed',
        },
      });
    });

    it('VALID: {mixed tool_use items, one signal-back} => extracts signal', () => {
      const result = signalExtractorTransformer({
        parsed: snakeKeysToCamelKeysTransformer({
          value: JSON.parse(
            JSON.stringify({
              type: 'assistant',
              message: {
                content: [
                  {
                    type: 'tool_use',
                    id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
                    name: 'mcp__dungeonmaster__other-tool',
                    input: { foo: 'bar' },
                  },
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
        }),
      });

      expect(result).toStrictEqual({
        signal: {
          signal: 'complete',
          summary: 'Done',
        },
      });
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
