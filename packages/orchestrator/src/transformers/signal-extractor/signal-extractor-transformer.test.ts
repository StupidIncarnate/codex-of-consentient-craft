import {
  AssistantTextStreamLineStub,
  AssistantToolUseStreamLineStub,
} from '@dungeonmaster/shared/contracts';

import { StreamJsonLineStub } from '../../contracts/stream-json-line/stream-json-line.stub';

import { signalExtractorTransformer } from './signal-extractor-transformer';

describe('signalExtractorTransformer', () => {
  describe('valid signal extraction', () => {
    it('VALID: {line with signal-back tool call} => returns extracted signal', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
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
      });

      const result = signalExtractorTransformer({ line });

      expect(result).toStrictEqual({
        signal: {
          signal: 'complete',
          summary: 'Task completed',
        },
      });
    });

    it('VALID: {mixed tool_use items, one signal-back} => extracts signal', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
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
      });

      const result = signalExtractorTransformer({ line });

      expect(result).toStrictEqual({
        signal: {
          signal: 'complete',
          summary: 'Done',
        },
      });
    });
  });

  describe('no signal found', () => {
    it('EMPTY: {line with no signal} => returns signal null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify(AssistantTextStreamLineStub()),
      });

      const result = signalExtractorTransformer({ line });

      expect(result).toStrictEqual({ signal: null });
    });

    it('EMPTY: {valid JSON that is not stream-json structure} => returns signal null', () => {
      const line = StreamJsonLineStub({ value: '{"foo":"bar"}' });

      const result = signalExtractorTransformer({ line });

      expect(result).toStrictEqual({ signal: null });
    });

    it('EMPTY: {non-JSON line} => returns signal null', () => {
      const line = StreamJsonLineStub({ value: 'this is not JSON' });

      const result = signalExtractorTransformer({ line });

      expect(result).toStrictEqual({ signal: null });
    });

    it('EMPTY: {JSON line without signal-back tool} => returns signal null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify(
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
      });

      const result = signalExtractorTransformer({ line });

      expect(result).toStrictEqual({ signal: null });
    });
  });
});
