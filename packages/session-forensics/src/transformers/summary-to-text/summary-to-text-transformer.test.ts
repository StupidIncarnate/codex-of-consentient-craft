import { summaryToTextTransformer } from './summary-to-text-transformer';
import { TranscriptSummaryStub } from '../../contracts/transcript-summary/transcript-summary.stub';

describe('summaryToTextTransformer', () => {
  describe('full summary', () => {
    it('VALID: {timestamps, two models, two tools} => renders the whole fixed block', () => {
      const summary = TranscriptSummaryStub({
        recordCount: 412,
        apiResponseCount: 96,
        startedAt: '2026-08-01T10:00:00.000Z',
        endedAt: '2026-08-01T11:30:00.000Z',
        wallClockSeconds: 5400,
        models: { 'claude-opus-5': 60, 'claude-sonnet-5': 36 },
        toolCallCounts: { Read: 40, Edit: 12 },
        toolResultBytes: 204_800,
        subagentCount: 3,
      });

      const result = summaryToTextTransformer({ summary });

      expect(String(result)).toBe(
        [
          'Lines in the transcript  412',
          'Times the model replied  96 (one reply covers several lines of the transcript)',
          'Session started          2026-08-01T10:00:00.000Z',
          'Session ended            2026-08-01T11:30:00.000Z',
          'Ran for                  90.0 minutes',
          'Models used              claude-opus-5x60, claude-sonnet-5x36',
          '',
          'Tokens for this session only. Sub-agents are counted separately.',
          'Cache reads and cache writes are priced differently, so they are counted on separate lines.',
          '  Fed in, not cached       : 2',
          '  Fed in, read from cache  : 0',
          '  Fed in, written to cache : 32,335',
          '  Written out by the model : 239',
          '  Of that output, thinking : 0',
          '  Total fed into the model : 32,337',
          '',
          'Tool calls the model made (52 in total)',
          '     40  Read',
          '     12  Edit',
          '',
          'Bytes returned by tools  204,800',
          'Sub-agents started       3',
        ].join('\n'),
      );
    });
  });

  describe('no timestamped record', () => {
    it('EMPTY: {startedAt, endedAt, wallClockSeconds all absent} => the start line says nothing was timestamped, the end and duration lines are omitted', () => {
      const summary = TranscriptSummaryStub({
        recordCount: 50,
        apiResponseCount: 20,
        models: { 'claude-sonnet-5': 20 },
        toolCallCounts: { Read: 5 },
        toolResultBytes: 1000,
        subagentCount: 0,
        usage: {
          inputTokens: 1,
          outputTokens: 2,
          cacheReadTokens: 0,
          cacheCreationTokens: 0,
          thinkingTokens: 0,
        },
        startedAt: undefined,
        endedAt: undefined,
        wallClockSeconds: undefined,
      });

      const result = summaryToTextTransformer({ summary });

      expect(String(result)).toBe(
        [
          'Lines in the transcript  50',
          'Times the model replied  20 (one reply covers several lines of the transcript)',
          'Session started          (nothing in the file was timestamped)',
          'Models used              claude-sonnet-5x20',
          '',
          'Tokens for this session only. Sub-agents are counted separately.',
          'Cache reads and cache writes are priced differently, so they are counted on separate lines.',
          '  Fed in, not cached       : 1',
          '  Fed in, read from cache  : 0',
          '  Fed in, written to cache : 0',
          '  Written out by the model : 2',
          '  Of that output, thinking : 0',
          '  Total fed into the model : 1',
          '',
          'Tool calls the model made (5 in total)',
          '      5  Read',
          '',
          'Bytes returned by tools  1,000',
          'Sub-agents started       0',
        ].join('\n'),
      );
    });
  });

  describe('zero tool calls', () => {
    it('EMPTY: {toolCallCounts: {}} => the tool-call heading shows 0 with no rows beneath it', () => {
      const summary = TranscriptSummaryStub({
        recordCount: 10,
        apiResponseCount: 4,
        startedAt: '2026-01-01T00:00:00.000Z',
        endedAt: '2026-01-01T00:01:00.000Z',
        wallClockSeconds: 60,
        models: { 'claude-sonnet-5': 4 },
        toolCallCounts: {},
        toolResultBytes: 0,
        subagentCount: 0,
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheCreationTokens: 0,
          thinkingTokens: 0,
        },
      });

      const result = summaryToTextTransformer({ summary });

      expect(String(result)).toBe(
        [
          'Lines in the transcript  10',
          'Times the model replied  4 (one reply covers several lines of the transcript)',
          'Session started          2026-01-01T00:00:00.000Z',
          'Session ended            2026-01-01T00:01:00.000Z',
          'Ran for                  1.0 minutes',
          'Models used              claude-sonnet-5x4',
          '',
          'Tokens for this session only. Sub-agents are counted separately.',
          'Cache reads and cache writes are priced differently, so they are counted on separate lines.',
          '  Fed in, not cached       : 0',
          '  Fed in, read from cache  : 0',
          '  Fed in, written to cache : 0',
          '  Written out by the model : 0',
          '  Of that output, thinking : 0',
          '  Total fed into the model : 0',
          '',
          'Tool calls the model made (0 in total)',
          '',
          'Bytes returned by tools  0',
          'Sub-agents started       0',
        ].join('\n'),
      );
    });
  });

  describe('tool call ordering', () => {
    it('VALID: {four tools, a count tie} => descending count, ties broken by ascending name', () => {
      const summary = TranscriptSummaryStub({
        recordCount: 30,
        apiResponseCount: 10,
        startedAt: '2026-01-01T00:00:00.000Z',
        endedAt: '2026-01-01T00:10:00.000Z',
        wallClockSeconds: 600,
        models: { 'claude-sonnet-5': 10 },
        toolCallCounts: { Bash: 5, Read: 5, Edit: 10, Grep: 3 },
        toolResultBytes: 500,
        subagentCount: 0,
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheCreationTokens: 0,
          thinkingTokens: 0,
        },
      });

      const result = summaryToTextTransformer({ summary });

      expect(String(result)).toBe(
        [
          'Lines in the transcript  30',
          'Times the model replied  10 (one reply covers several lines of the transcript)',
          'Session started          2026-01-01T00:00:00.000Z',
          'Session ended            2026-01-01T00:10:00.000Z',
          'Ran for                  10.0 minutes',
          'Models used              claude-sonnet-5x10',
          '',
          'Tokens for this session only. Sub-agents are counted separately.',
          'Cache reads and cache writes are priced differently, so they are counted on separate lines.',
          '  Fed in, not cached       : 0',
          '  Fed in, read from cache  : 0',
          '  Fed in, written to cache : 0',
          '  Written out by the model : 0',
          '  Of that output, thinking : 0',
          '  Total fed into the model : 0',
          '',
          'Tool calls the model made (23 in total)',
          '     10  Edit',
          '      5  Bash',
          '      5  Read',
          '      3  Grep',
          '',
          'Bytes returned by tools  500',
          'Sub-agents started       0',
        ].join('\n'),
      );
    });
  });

  describe('model ordering', () => {
    it('VALID: {two models, higher count listed second} => ascending name order, not count order', () => {
      const summary = TranscriptSummaryStub({
        recordCount: 20,
        apiResponseCount: 8,
        startedAt: '2026-01-01T00:00:00.000Z',
        endedAt: '2026-01-01T00:05:00.000Z',
        wallClockSeconds: 300,
        models: { 'zeta-model': 3, 'alpha-model': 5 },
        toolCallCounts: { Read: 2 },
        toolResultBytes: 100,
        subagentCount: 0,
        usage: {
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheCreationTokens: 0,
          thinkingTokens: 0,
        },
      });

      const result = summaryToTextTransformer({ summary });

      expect(String(result)).toBe(
        [
          'Lines in the transcript  20',
          'Times the model replied  8 (one reply covers several lines of the transcript)',
          'Session started          2026-01-01T00:00:00.000Z',
          'Session ended            2026-01-01T00:05:00.000Z',
          'Ran for                  5.0 minutes',
          'Models used              alpha-modelx5, zeta-modelx3',
          '',
          'Tokens for this session only. Sub-agents are counted separately.',
          'Cache reads and cache writes are priced differently, so they are counted on separate lines.',
          '  Fed in, not cached       : 0',
          '  Fed in, read from cache  : 0',
          '  Fed in, written to cache : 0',
          '  Written out by the model : 0',
          '  Of that output, thinking : 0',
          '  Total fed into the model : 0',
          '',
          'Tool calls the model made (2 in total)',
          '      2  Read',
          '',
          'Bytes returned by tools  100',
          'Sub-agents started       0',
        ].join('\n'),
      );
    });
  });
});
