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
          'LINES     412',
          'API CALLS 96 (assistant records — one API response spans several transcript lines)',
          'START     2026-08-01T10:00:00.000Z',
          'END       2026-08-01T11:30:00.000Z',
          'WALL      90.0 min',
          'MODELS    claude-opus-5x60, claude-sonnet-5x36',
          '',
          'TOKENS (this transcript only, excludes sub-agents)',
          '  input (uncached)  : 2',
          '  cache_read        : 0',
          '  cache_creation    : 32,335',
          '  output            : 239',
          '  of which thinking : 0',
          '  TOTAL context-in  : 32,337',
          '',
          'TOOL CALLS (52)',
          '     40  Read',
          '     12  Edit',
          '',
          'TOOL RESULT BYTES 204,800',
          'SUBAGENTS 3',
        ].join('\n'),
      );
    });
  });

  describe('no timestamped record', () => {
    it('EMPTY: {startedAt, endedAt, wallClockSeconds all absent} => START shows the placeholder, END and WALL are omitted', () => {
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
          'LINES     50',
          'API CALLS 20 (assistant records — one API response spans several transcript lines)',
          'START     (no timestamped record)',
          'MODELS    claude-sonnet-5x20',
          '',
          'TOKENS (this transcript only, excludes sub-agents)',
          '  input (uncached)  : 1',
          '  cache_read        : 0',
          '  cache_creation    : 0',
          '  output            : 2',
          '  of which thinking : 0',
          '  TOTAL context-in  : 1',
          '',
          'TOOL CALLS (5)',
          '      5  Read',
          '',
          'TOOL RESULT BYTES 1,000',
          'SUBAGENTS 0',
        ].join('\n'),
      );
    });
  });

  describe('zero tool calls', () => {
    it('EMPTY: {toolCallCounts: {}} => TOOL CALLS header shows 0 with no rows beneath it', () => {
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
          'LINES     10',
          'API CALLS 4 (assistant records — one API response spans several transcript lines)',
          'START     2026-01-01T00:00:00.000Z',
          'END       2026-01-01T00:01:00.000Z',
          'WALL      1.0 min',
          'MODELS    claude-sonnet-5x4',
          '',
          'TOKENS (this transcript only, excludes sub-agents)',
          '  input (uncached)  : 0',
          '  cache_read        : 0',
          '  cache_creation    : 0',
          '  output            : 0',
          '  of which thinking : 0',
          '  TOTAL context-in  : 0',
          '',
          'TOOL CALLS (0)',
          '',
          'TOOL RESULT BYTES 0',
          'SUBAGENTS 0',
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
          'LINES     30',
          'API CALLS 10 (assistant records — one API response spans several transcript lines)',
          'START     2026-01-01T00:00:00.000Z',
          'END       2026-01-01T00:10:00.000Z',
          'WALL      10.0 min',
          'MODELS    claude-sonnet-5x10',
          '',
          'TOKENS (this transcript only, excludes sub-agents)',
          '  input (uncached)  : 0',
          '  cache_read        : 0',
          '  cache_creation    : 0',
          '  output            : 0',
          '  of which thinking : 0',
          '  TOTAL context-in  : 0',
          '',
          'TOOL CALLS (23)',
          '     10  Edit',
          '      5  Bash',
          '      5  Read',
          '      3  Grep',
          '',
          'TOOL RESULT BYTES 500',
          'SUBAGENTS 0',
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
          'LINES     20',
          'API CALLS 8 (assistant records — one API response spans several transcript lines)',
          'START     2026-01-01T00:00:00.000Z',
          'END       2026-01-01T00:05:00.000Z',
          'WALL      5.0 min',
          'MODELS    alpha-modelx5, zeta-modelx3',
          '',
          'TOKENS (this transcript only, excludes sub-agents)',
          '  input (uncached)  : 0',
          '  cache_read        : 0',
          '  cache_creation    : 0',
          '  output            : 0',
          '  of which thinking : 0',
          '  TOTAL context-in  : 0',
          '',
          'TOOL CALLS (2)',
          '      2  Read',
          '',
          'TOOL RESULT BYTES 100',
          'SUBAGENTS 0',
        ].join('\n'),
      );
    });
  });
});
