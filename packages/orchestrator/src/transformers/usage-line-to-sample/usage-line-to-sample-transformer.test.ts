import { usageLineToSampleTransformer } from './usage-line-to-sample-transformer';

// 2026-09-13T04:49:29.242Z falls in the hour starting 2026-09-13T04:00:00.000Z.
const HOUR_START = Date.parse('2026-09-13T04:00:00.000Z');

describe('usageLineToSampleTransformer', () => {
  describe('lines that record spend', () => {
    it('VALID: {all four counts} => returns them bucketed to the hour', () => {
      const line = JSON.stringify({
        type: 'assistant',
        timestamp: '2026-09-13T04:49:29.242Z',
        message: {
          role: 'assistant',
          usage: {
            input_tokens: 120,
            cache_creation_input_tokens: 4_000,
            cache_read_input_tokens: 90_000,
            output_tokens: 300,
          },
        },
      });

      expect(usageLineToSampleTransformer({ line })).toStrictEqual({
        bucketStartMs: HOUR_START,
        tokens: { input: 120, cacheCreation: 4_000, cacheRead: 90_000, output: 300 },
      });
    });

    it('EMPTY: {usage present but empty} => returns a zero sample, not null', () => {
      const line = JSON.stringify({
        type: 'assistant',
        timestamp: '2026-09-13T04:49:29.242Z',
        message: { role: 'assistant', usage: {} },
      });

      expect(usageLineToSampleTransformer({ line })).toStrictEqual({
        bucketStartMs: HOUR_START,
        tokens: { input: 0, cacheCreation: 0, cacheRead: 0, output: 0 },
      });
    });

    it('VALID: {an explicit null count} => reads it as zero', () => {
      const line = JSON.stringify({
        type: 'assistant',
        timestamp: '2026-09-13T04:49:29.242Z',
        message: { role: 'assistant', usage: { input_tokens: null, output_tokens: 7 } },
      });

      expect(usageLineToSampleTransformer({ line })).toStrictEqual({
        bucketStartMs: HOUR_START,
        tokens: { input: 0, cacheCreation: 0, cacheRead: 0, output: 7 },
      });
    });

    it('VALID: {a sub-agent line} => is counted, because quota is billed to the account', () => {
      const line = JSON.stringify({
        type: 'assistant',
        isSidechain: true,
        agentId: 'a0a7f82d9619a1800',
        timestamp: '2026-09-13T04:49:29.242Z',
        message: { role: 'assistant', usage: { output_tokens: 42 } },
      });

      expect(usageLineToSampleTransformer({ line })).toStrictEqual({
        bucketStartMs: HOUR_START,
        tokens: { input: 0, cacheCreation: 0, cacheRead: 0, output: 42 },
      });
    });

    it('EDGE: {a timestamp exactly on the hour} => buckets to that same hour', () => {
      const line = JSON.stringify({
        type: 'assistant',
        timestamp: '2026-09-13T04:00:00.000Z',
        message: { role: 'assistant', usage: { output_tokens: 1 } },
      });

      expect(usageLineToSampleTransformer({ line })).toStrictEqual({
        bucketStartMs: HOUR_START,
        tokens: { input: 0, cacheCreation: 0, cacheRead: 0, output: 1 },
      });
    });
  });

  describe('lines that record nothing', () => {
    it('EMPTY: {a user turn} => returns null', () => {
      const line = JSON.stringify({
        type: 'user',
        timestamp: '2026-09-13T04:49:29.242Z',
        message: { role: 'user', content: 'hello' },
      });

      expect(usageLineToSampleTransformer({ line })).toBe(null);
    });

    it('EMPTY: {line: ""} => returns null', () => {
      expect(usageLineToSampleTransformer({ line: '' })).toBe(null);
    });

    it('ERROR: {a torn half-written line} => returns null rather than throwing', () => {
      const torn =
        '{"type":"assistant","timestamp":"2026-09-13T04:49:29.242Z","message":{"usage":{"outp';

      expect(usageLineToSampleTransformer({ line: torn })).toBe(null);
    });

    it('ERROR: {a usage line with an unparseable timestamp} => returns null', () => {
      const line = JSON.stringify({
        type: 'assistant',
        timestamp: 'not-a-date',
        message: { role: 'assistant', usage: { output_tokens: 5 } },
      });

      expect(usageLineToSampleTransformer({ line })).toBe(null);
    });

    it('EMPTY: {a line mentioning usage only in prose} => returns null', () => {
      const line = JSON.stringify({
        type: 'assistant',
        timestamp: '2026-09-13T04:49:29.242Z',
        message: { role: 'assistant', content: [{ type: 'text', text: 'the "usage" field' }] },
      });

      expect(usageLineToSampleTransformer({ line })).toBe(null);
    });
  });
});
