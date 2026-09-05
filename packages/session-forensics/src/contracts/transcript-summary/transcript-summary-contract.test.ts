import { transcriptSummaryContract } from './transcript-summary-contract';
import { TranscriptSummaryStub } from './transcript-summary.stub';
import { TokenUsageStub } from '../token-usage/token-usage.stub';

describe('transcriptSummaryContract', () => {
  describe('valid input', () => {
    it('VALID: {timestamps, two models, several tools} => returns the branded summary', () => {
      const result = transcriptSummaryContract.parse({
        recordCount: 412,
        apiResponseCount: 96,
        startedAt: '2026-08-01T10:00:00.000Z',
        endedAt: '2026-08-01T11:30:00.000Z',
        wallClockSeconds: 5400,
        models: { 'claude-opus-5': 60, 'claude-sonnet-5': 36 },
        recordTypeCounts: { assistant: 96, user: 96, attachment: 4 },
        toolCallCounts: { Read: 40, Edit: 12, Bash: 8 },
        toolResultBytes: 204_800,
        subagentCount: 3,
        usage: TokenUsageStub(),
      });

      expect(result).toStrictEqual(
        TranscriptSummaryStub({
          recordCount: 412,
          apiResponseCount: 96,
          startedAt: '2026-08-01T10:00:00.000Z',
          endedAt: '2026-08-01T11:30:00.000Z',
          wallClockSeconds: 5400,
          models: { 'claude-opus-5': 60, 'claude-sonnet-5': 36 },
          recordTypeCounts: { assistant: 96, user: 96, attachment: 4 },
          toolCallCounts: { Read: 40, Edit: 12, Bash: 8 },
          toolResultBytes: 204_800,
          subagentCount: 3,
          usage: TokenUsageStub(),
        }),
      );
    });
  });

  describe('zero-record transcript', () => {
    it('EMPTY: {recordCount: 0} => returns zero counts with timestamps and wallClockSeconds omitted', () => {
      const result = transcriptSummaryContract.parse({
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
  });

  describe('single model and tool', () => {
    it('EDGE: {one model, one tool} => returns the branded summary', () => {
      const result = transcriptSummaryContract.parse({
        recordCount: 10,
        apiResponseCount: 5,
        startedAt: '2026-08-01T10:00:00.000Z',
        endedAt: '2026-08-01T10:05:00.000Z',
        wallClockSeconds: 300,
        models: { 'claude-sonnet-5': 5 },
        recordTypeCounts: { assistant: 5, user: 5 },
        toolCallCounts: { Read: 2 },
        toolResultBytes: 1024,
        subagentCount: 0,
        usage: TokenUsageStub(),
      });

      expect(result).toStrictEqual(
        TranscriptSummaryStub({
          recordCount: 10,
          apiResponseCount: 5,
          startedAt: '2026-08-01T10:00:00.000Z',
          endedAt: '2026-08-01T10:05:00.000Z',
          wallClockSeconds: 300,
          models: { 'claude-sonnet-5': 5 },
          recordTypeCounts: { assistant: 5, user: 5 },
          toolCallCounts: { Read: 2 },
          toolResultBytes: 1024,
          subagentCount: 0,
          usage: TokenUsageStub(),
        }),
      );
    });
  });

  describe('invalid input', () => {
    it('INVALID: {recordCount: -1} => throws', () => {
      expect(() => TranscriptSummaryStub({ recordCount: -1 })).toThrow(
        /greater than or equal to 0|Number must be/u,
      );
    });

    it('INVALID: {apiResponseCount: string} => throws', () => {
      expect(() => TranscriptSummaryStub({ apiResponseCount: '96' as never })).toThrow(
        /Expected number/u,
      );
    });

    it('INVALID: {toolCallCounts value: string} => throws', () => {
      expect(() => TranscriptSummaryStub({ toolCallCounts: { Read: 'many' } as never })).toThrow(
        /Expected number/u,
      );
    });
  });
});
