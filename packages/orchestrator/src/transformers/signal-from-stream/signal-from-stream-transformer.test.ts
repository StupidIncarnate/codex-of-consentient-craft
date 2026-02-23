import {
  AssistantTextStreamLineStub,
  AssistantToolUseStreamLineStub,
} from '@dungeonmaster/shared/contracts';

import { signalFromStreamTransformer } from './signal-from-stream-transformer';
import { StreamJsonLineStub } from '../../contracts/stream-json-line/stream-json-line.stub';
import { StepIdStub } from '@dungeonmaster/shared/contracts';

describe('signalFromStreamTransformer', () => {
  describe('valid signal extraction', () => {
    it('VALID: {assistant message with signal-back tool call} => returns StreamSignal', () => {
      const stepId = StepIdStub();
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
                  stepId,
                  summary: 'Task completed',
                },
              },
            ],
          },
        }),
      });

      const result = signalFromStreamTransformer({ line });

      expect(result).toStrictEqual({
        signal: 'complete',
        stepId,
        summary: 'Task completed',
      });
    });

    it('VALID: {partially-complete signal} => returns StreamSignal with progress', () => {
      const stepId = StepIdStub();
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [
              {
                type: 'tool_use',
                name: 'mcp__dungeonmaster__signal-back',
                input: {
                  signal: 'partially-complete',
                  stepId,
                  progress: 'Half done',
                  continuationPoint: 'Step 3',
                },
              },
            ],
          },
        }),
      });

      const result = signalFromStreamTransformer({ line });

      expect(result).toStrictEqual({
        signal: 'partially-complete',
        stepId,
        progress: 'Half done',
        continuationPoint: 'Step 3',
      });
    });

    it('VALID: {multiple tool calls with signal-back} => returns first signal', () => {
      const stepId = StepIdStub();
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [
              { type: 'text', text: 'Some text' },
              {
                type: 'tool_use',
                name: 'mcp__dungeonmaster__signal-back',
                input: {
                  signal: 'complete',
                  stepId,
                  summary: 'Done',
                },
              },
            ],
          },
        }),
      });

      const result = signalFromStreamTransformer({ line });

      expect(result).toStrictEqual({
        signal: 'complete',
        stepId,
        summary: 'Done',
      });
    });

    it('VALID: {needs-role-followup signal} => returns StreamSignal with targetRole', () => {
      const stepId = StepIdStub();
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: [
              {
                type: 'tool_use',
                name: 'mcp__dungeonmaster__signal-back',
                input: {
                  signal: 'needs-role-followup',
                  stepId,
                  targetRole: 'reviewer',
                  reason: 'Code needs review before merge',
                  context: 'PR ready for review',
                  resume: true,
                },
              },
            ],
          },
        }),
      });

      const result = signalFromStreamTransformer({ line });

      expect(result).toStrictEqual({
        signal: 'needs-role-followup',
        stepId,
        targetRole: 'reviewer',
        reason: 'Code needs review before merge',
        context: 'PR ready for review',
        resume: true,
      });
    });
  });

  describe('no signal found', () => {
    it('EMPTY: {JSON null value} => returns null', () => {
      const line = StreamJsonLineStub({
        value: 'null',
      });

      const result = signalFromStreamTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {JSON primitive string} => returns null', () => {
      const line = StreamJsonLineStub({
        value: '"just a string"',
      });

      const result = signalFromStreamTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {object without type property} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          message: { content: [] },
        }),
      });

      const result = signalFromStreamTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {non-assistant message} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'system',
          message: 'Hello',
        }),
      });

      const result = signalFromStreamTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {assistant message without tool calls} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify(AssistantTextStreamLineStub()),
      });

      const result = signalFromStreamTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {different MCP tool call} => returns null', () => {
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

      const result = signalFromStreamTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {assistant message with no content property} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {},
        }),
      });

      const result = signalFromStreamTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {assistant message with null message} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: null,
        }),
      });

      const result = signalFromStreamTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {assistant without message property} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
        }),
      });

      const result = signalFromStreamTransformer({ line });

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

      const result = signalFromStreamTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {assistant message with non-array content} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
          type: 'assistant',
          message: {
            content: 'not an array',
          },
        }),
      });

      const result = signalFromStreamTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {signal-back with invalid input} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
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
      });

      const result = signalFromStreamTransformer({ line });

      expect(result).toBeNull();
    });

    it('EMPTY: {signal-back tool use without input property} => returns null', () => {
      const line = StreamJsonLineStub({
        value: JSON.stringify({
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
      });

      const result = signalFromStreamTransformer({ line });

      expect(result).toBeNull();
    });
  });

  describe('invalid JSON handling', () => {
    it('ERROR: {invalid JSON} => returns null', () => {
      const line = StreamJsonLineStub({
        value: 'not valid json',
      });

      const result = signalFromStreamTransformer({ line });

      expect(result).toBeNull();
    });

    it('ERROR: {truncated JSON} => returns null', () => {
      const line = StreamJsonLineStub({
        value: '{"type":"assistant"',
      });

      const result = signalFromStreamTransformer({ line });

      expect(result).toBeNull();
    });
  });
});
