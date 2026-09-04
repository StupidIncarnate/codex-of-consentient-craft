import { recordsToSummaryTransformer } from './records-to-summary-transformer';
import { TranscriptRecordStub } from '../../contracts/transcript-record/transcript-record.stub';
import { TranscriptSummaryStub } from '../../contracts/transcript-summary/transcript-summary.stub';
import { TokenUsageStub } from '../../contracts/token-usage/token-usage.stub';

describe('recordsToSummaryTransformer', () => {
  describe('valid input', () => {
    it('VALID: {two assistant records with usage and tool_use, one user record with a toolUseResult} => every field of the summary', () => {
      const result = recordsToSummaryTransformer({
        records: [
          TranscriptRecordStub({
            timestamp: '2026-09-01T19:00:00.000Z',
            message: {
              model: 'claude-opus-5',
              content: [
                { type: 'text', text: 'Reading the file now.' },
                { type: 'tool_use', name: 'Read', input: { file_path: '/tmp/x.ts' } },
              ],
              usage: {
                input_tokens: 2,
                output_tokens: 100,
                cache_read_input_tokens: 0,
                cache_creation_input_tokens: 50,
                output_tokens_details: { thinking_tokens: 10 },
              },
            },
          }),
          TranscriptRecordStub({
            timestamp: '2026-09-01T19:05:00.000Z',
            message: {
              model: 'claude-sonnet-5',
              content: [{ type: 'tool_use', name: 'Edit', input: { file_path: '/tmp/y.ts' } }],
              usage: {
                input_tokens: 3,
                output_tokens: 200,
                cache_read_input_tokens: 5,
                cache_creation_input_tokens: 0,
              },
            },
          }),
          TranscriptRecordStub({
            type: 'user',
            timestamp: '2026-09-01T19:10:00.000Z',
            message: { content: 'Here is the result.' },
            toolUseResult: { success: true },
          }),
        ],
        subagentCount: 4,
      });

      expect(result).toStrictEqual(
        TranscriptSummaryStub({
          recordCount: 3,
          apiResponseCount: 2,
          startedAt: '2026-09-01T19:00:00.000Z',
          endedAt: '2026-09-01T19:10:00.000Z',
          wallClockSeconds: 600,
          models: { 'claude-opus-5': 1, 'claude-sonnet-5': 1 },
          recordTypeCounts: { assistant: 2, user: 1 },
          toolCallCounts: { Read: 1, Edit: 1 },
          toolResultBytes: 16,
          subagentCount: 4,
          usage: TokenUsageStub({
            inputTokens: 5,
            outputTokens: 300,
            cacheReadTokens: 5,
            cacheCreationTokens: 50,
            thinkingTokens: 10,
          }),
        }),
      );
    });
  });

  describe('edge cases', () => {
    it('EDGE: {one record only} => startedAt equals endedAt, wallClockSeconds 0', () => {
      const result = recordsToSummaryTransformer({
        records: [TranscriptRecordStub({ timestamp: '2026-09-01T19:00:00.000Z' })],
        subagentCount: 2,
      });

      expect(result).toStrictEqual(
        TranscriptSummaryStub({
          recordCount: 1,
          apiResponseCount: 1,
          startedAt: '2026-09-01T19:00:00.000Z',
          endedAt: '2026-09-01T19:00:00.000Z',
          wallClockSeconds: 0,
          models: { 'claude-opus-5': 1 },
          recordTypeCounts: { assistant: 1 },
          toolCallCounts: {},
          toolResultBytes: 0,
          subagentCount: 2,
          usage: TokenUsageStub({
            inputTokens: 0,
            outputTokens: 0,
            cacheReadTokens: 0,
            cacheCreationTokens: 0,
            thinkingTokens: 0,
          }),
        }),
      );
    });

    it('EDGE: {records out of chronological order} => earliest/latest still correct', () => {
      const result = recordsToSummaryTransformer({
        records: [
          TranscriptRecordStub({ timestamp: '2026-09-01T19:05:00.000Z' }),
          TranscriptRecordStub({ timestamp: '2026-09-01T19:00:00.000Z' }),
        ],
      });

      expect(result).toStrictEqual(
        TranscriptSummaryStub({
          recordCount: 2,
          apiResponseCount: 2,
          startedAt: '2026-09-01T19:00:00.000Z',
          endedAt: '2026-09-01T19:05:00.000Z',
          wallClockSeconds: 300,
          models: { 'claude-opus-5': 2 },
          recordTypeCounts: { assistant: 2 },
          toolCallCounts: {},
          toolResultBytes: 0,
          subagentCount: 0,
          usage: TokenUsageStub({
            inputTokens: 0,
            outputTokens: 0,
            cacheReadTokens: 0,
            cacheCreationTokens: 0,
            thinkingTokens: 0,
          }),
        }),
      );
    });

    it('EDGE: {two different models} => both counted', () => {
      const result = recordsToSummaryTransformer({
        records: [
          TranscriptRecordStub({
            timestamp: '2026-09-01T19:00:00.000Z',
            message: { model: 'claude-opus-5', content: [{ type: 'text', text: 'On it.' }] },
          }),
          TranscriptRecordStub({
            timestamp: '2026-09-01T19:01:00.000Z',
            message: { model: 'claude-sonnet-5', content: [{ type: 'text', text: 'On it.' }] },
          }),
        ],
      });

      expect(result).toStrictEqual(
        TranscriptSummaryStub({
          recordCount: 2,
          apiResponseCount: 2,
          startedAt: '2026-09-01T19:00:00.000Z',
          endedAt: '2026-09-01T19:01:00.000Z',
          wallClockSeconds: 60,
          models: { 'claude-opus-5': 1, 'claude-sonnet-5': 1 },
          recordTypeCounts: { assistant: 2 },
          toolCallCounts: {},
          toolResultBytes: 0,
          subagentCount: 0,
          usage: TokenUsageStub({
            inputTokens: 0,
            outputTokens: 0,
            cacheReadTokens: 0,
            cacheCreationTokens: 0,
            thinkingTokens: 0,
          }),
        }),
      );
    });

    it('EDGE: {assistant record with no message.model} => not counted in models, still counted in apiResponseCount', () => {
      const result = recordsToSummaryTransformer({
        records: [
          TranscriptRecordStub({
            timestamp: '2026-09-01T19:00:00.000Z',
            message: { content: [{ type: 'text', text: 'On it.' }] },
          }),
          TranscriptRecordStub({ timestamp: '2026-09-01T19:01:00.000Z' }),
        ],
      });

      expect(result).toStrictEqual(
        TranscriptSummaryStub({
          recordCount: 2,
          apiResponseCount: 2,
          startedAt: '2026-09-01T19:00:00.000Z',
          endedAt: '2026-09-01T19:01:00.000Z',
          wallClockSeconds: 60,
          models: { 'claude-opus-5': 1 },
          recordTypeCounts: { assistant: 2 },
          toolCallCounts: {},
          toolResultBytes: 0,
          subagentCount: 0,
          usage: TokenUsageStub({
            inputTokens: 0,
            outputTokens: 0,
            cacheReadTokens: 0,
            cacheCreationTokens: 0,
            thinkingTokens: 0,
          }),
        }),
      );
    });

    it('EDGE: {toolUseResult is a bare string} => its stringified length counted', () => {
      const result = recordsToSummaryTransformer({
        records: [
          TranscriptRecordStub({
            type: 'user',
            timestamp: '2026-09-01T19:00:00.000Z',
            message: { content: 'Result was ok.' },
            toolUseResult: 'ok',
          }),
        ],
      });

      expect(result).toStrictEqual(
        TranscriptSummaryStub({
          recordCount: 1,
          apiResponseCount: 0,
          startedAt: '2026-09-01T19:00:00.000Z',
          endedAt: '2026-09-01T19:00:00.000Z',
          wallClockSeconds: 0,
          models: {},
          recordTypeCounts: { user: 1 },
          toolCallCounts: {},
          toolResultBytes: 4,
          subagentCount: 0,
          usage: TokenUsageStub({
            inputTokens: 0,
            outputTokens: 0,
            cacheReadTokens: 0,
            cacheCreationTokens: 0,
            thinkingTokens: 0,
          }),
        }),
      );
    });

    it('EDGE: {subagentCount omitted} => 0', () => {
      const result = recordsToSummaryTransformer({
        records: [TranscriptRecordStub({ timestamp: '2026-09-01T19:00:00.000Z' })],
      });

      expect(result).toStrictEqual(
        TranscriptSummaryStub({
          recordCount: 1,
          apiResponseCount: 1,
          startedAt: '2026-09-01T19:00:00.000Z',
          endedAt: '2026-09-01T19:00:00.000Z',
          wallClockSeconds: 0,
          models: { 'claude-opus-5': 1 },
          recordTypeCounts: { assistant: 1 },
          toolCallCounts: {},
          toolResultBytes: 0,
          subagentCount: 0,
          usage: TokenUsageStub({
            inputTokens: 0,
            outputTokens: 0,
            cacheReadTokens: 0,
            cacheCreationTokens: 0,
            thinkingTokens: 0,
          }),
        }),
      );
    });
  });

  describe('empty input', () => {
    it('EMPTY: {no records} => all counts 0, empty record objects, startedAt/endedAt/wallClockSeconds absent', () => {
      const result = recordsToSummaryTransformer({ records: [] });

      expect(result).toStrictEqual({
        recordCount: 0,
        apiResponseCount: 0,
        models: {},
        recordTypeCounts: {},
        toolCallCounts: {},
        toolResultBytes: 0,
        subagentCount: 0,
        usage: TokenUsageStub({
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheCreationTokens: 0,
          thinkingTokens: 0,
        }),
      });
    });

    it('EMPTY: {records present but none timestamped} => same absence, counts still populated', () => {
      const result = recordsToSummaryTransformer({
        records: [
          TranscriptRecordStub({
            timestamp: undefined,
            message: {
              model: 'claude-opus-5',
              content: [{ type: 'tool_use', name: 'Read', input: {} }],
              usage: { input_tokens: 1, output_tokens: 1 },
            },
          }),
          TranscriptRecordStub({
            timestamp: undefined,
            message: {
              model: 'claude-opus-5',
              content: [{ type: 'tool_use', name: 'Read', input: {} }],
              usage: { input_tokens: 1, output_tokens: 1 },
            },
          }),
        ],
      });

      expect(result).toStrictEqual({
        recordCount: 2,
        apiResponseCount: 2,
        models: { 'claude-opus-5': 2 },
        recordTypeCounts: { assistant: 2 },
        toolCallCounts: { Read: 2 },
        toolResultBytes: 0,
        subagentCount: 0,
        usage: TokenUsageStub({
          inputTokens: 2,
          outputTokens: 2,
          cacheReadTokens: 0,
          cacheCreationTokens: 0,
          thinkingTokens: 0,
        }),
      });
    });
  });
});
