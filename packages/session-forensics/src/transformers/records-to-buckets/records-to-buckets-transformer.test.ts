import { recordsToBucketsTransformer } from './records-to-buckets-transformer';
import { TranscriptRecordStub } from '../../contracts/transcript-record/transcript-record.stub';
import { TimeBucketStub } from '../../contracts/time-bucket/time-bucket.stub';

describe('recordsToBucketsTransformer', () => {
  describe('single window', () => {
    it('VALID: {three records inside one window} => one bucket with the summed counts', () => {
      const result = recordsToBucketsTransformer({
        records: [
          TranscriptRecordStub({
            timestamp: '2026-01-01T00:00:00.000Z',
            message: {
              content: [{ type: 'tool_use', name: 'Read', input: {} }],
              usage: {
                input_tokens: 10,
                output_tokens: 5,
                cache_read_input_tokens: 2,
                cache_creation_input_tokens: 3,
              },
            },
          }),
          TranscriptRecordStub({
            timestamp: '2026-01-01T00:01:00.000Z',
            message: {
              content: [{ type: 'tool_use', name: 'Read', input: {} }],
              usage: {
                input_tokens: 20,
                output_tokens: 8,
                cache_read_input_tokens: 0,
                cache_creation_input_tokens: 0,
              },
            },
          }),
          TranscriptRecordStub({
            timestamp: '2026-01-01T00:02:00.000Z',
            message: {
              content: [{ type: 'tool_use', name: 'Write', input: {} }],
              usage: {
                input_tokens: 0,
                output_tokens: 2,
                cache_read_input_tokens: 1,
                cache_creation_input_tokens: 1,
              },
            },
          }),
        ],
        bucketMinutes: 5,
      });

      expect(result).toStrictEqual([
        TimeBucketStub({
          windowStart: '2026-01-01T00:00:00.000Z',
          windowEnd: '2026-01-01T00:05:00.000Z',
          apiResponseCount: 3,
          toolCallCount: 3,
          outputTokens: 15,
          contextInTokens: 37,
          toolResultBytes: 0,
          topTools: [
            { name: 'Read', count: 2 },
            { name: 'Write', count: 1 },
          ],
        }),
      ]);
    });
  });

  describe('silent window', () => {
    it('VALID: {records spanning three windows with the middle silent} => two buckets at indices 0 and 2, the middle window absent', () => {
      const result = recordsToBucketsTransformer({
        records: [
          TranscriptRecordStub({ timestamp: '2026-01-01T00:00:00.000Z' }),
          TranscriptRecordStub({ timestamp: '2026-01-01T00:12:00.000Z' }),
        ],
        bucketMinutes: 5,
      });

      expect(result).toStrictEqual([
        TimeBucketStub({
          windowStart: '2026-01-01T00:00:00.000Z',
          windowEnd: '2026-01-01T00:05:00.000Z',
          apiResponseCount: 1,
          toolCallCount: 0,
          outputTokens: 0,
          contextInTokens: 0,
          toolResultBytes: 0,
          topTools: [],
        }),
        TimeBucketStub({
          windowStart: '2026-01-01T00:10:00.000Z',
          windowEnd: '2026-01-01T00:15:00.000Z',
          apiResponseCount: 1,
          toolCallCount: 0,
          outputTokens: 0,
          contextInTokens: 0,
          toolResultBytes: 0,
          topTools: [],
        }),
      ]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {no records} => returns []', () => {
      const result = recordsToBucketsTransformer({ records: [] });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {records with no timestamp} => returns []', () => {
      const result = recordsToBucketsTransformer({
        records: [
          TranscriptRecordStub({ timestamp: undefined }),
          TranscriptRecordStub({
            type: 'user',
            timestamp: undefined,
            message: { content: 'a note with no timestamp' },
          }),
        ],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('bucket boundary', () => {
    it('EDGE: {one record exactly on a bucket boundary} => lands in the later bucket', () => {
      const result = recordsToBucketsTransformer({
        records: [
          TranscriptRecordStub({ timestamp: '2026-01-01T00:00:00.000Z' }),
          TranscriptRecordStub({ timestamp: '2026-01-01T00:05:00.000Z' }),
        ],
        bucketMinutes: 5,
      });

      expect(result).toStrictEqual([
        TimeBucketStub({
          windowStart: '2026-01-01T00:00:00.000Z',
          windowEnd: '2026-01-01T00:05:00.000Z',
          apiResponseCount: 1,
          toolCallCount: 0,
          outputTokens: 0,
          contextInTokens: 0,
          toolResultBytes: 0,
          topTools: [],
        }),
        TimeBucketStub({
          windowStart: '2026-01-01T00:05:00.000Z',
          windowEnd: '2026-01-01T00:10:00.000Z',
          apiResponseCount: 1,
          toolCallCount: 0,
          outputTokens: 0,
          contextInTokens: 0,
          toolResultBytes: 0,
          topTools: [],
        }),
      ]);
    });
  });

  describe('explicit bucket width', () => {
    it('EDGE: {bucketMinutes: 1} => finer split than the default', () => {
      const result = recordsToBucketsTransformer({
        records: [
          TranscriptRecordStub({ timestamp: '2026-01-01T00:00:00.000Z' }),
          TranscriptRecordStub({ timestamp: '2026-01-01T00:01:00.000Z' }),
        ],
        bucketMinutes: 1,
      });

      expect(result).toStrictEqual([
        TimeBucketStub({
          windowStart: '2026-01-01T00:00:00.000Z',
          windowEnd: '2026-01-01T00:01:00.000Z',
          apiResponseCount: 1,
          toolCallCount: 0,
          outputTokens: 0,
          contextInTokens: 0,
          toolResultBytes: 0,
          topTools: [],
        }),
        TimeBucketStub({
          windowStart: '2026-01-01T00:01:00.000Z',
          windowEnd: '2026-01-01T00:02:00.000Z',
          apiResponseCount: 1,
          toolCallCount: 0,
          outputTokens: 0,
          contextInTokens: 0,
          toolResultBytes: 0,
          topTools: [],
        }),
      ]);
    });
  });

  describe('topTools ordering', () => {
    it('VALID: {five distinct tools with different counts} => only the top four, in descending count', () => {
      const result = recordsToBucketsTransformer({
        records: [
          TranscriptRecordStub({
            timestamp: '2026-01-01T00:00:00.000Z',
            message: {
              content: [
                { type: 'tool_use', name: 'A', input: {} },
                { type: 'tool_use', name: 'A', input: {} },
                { type: 'tool_use', name: 'A', input: {} },
                { type: 'tool_use', name: 'A', input: {} },
                { type: 'tool_use', name: 'A', input: {} },
                { type: 'tool_use', name: 'B', input: {} },
                { type: 'tool_use', name: 'B', input: {} },
                { type: 'tool_use', name: 'B', input: {} },
                { type: 'tool_use', name: 'B', input: {} },
                { type: 'tool_use', name: 'C', input: {} },
                { type: 'tool_use', name: 'C', input: {} },
                { type: 'tool_use', name: 'C', input: {} },
                { type: 'tool_use', name: 'D', input: {} },
                { type: 'tool_use', name: 'D', input: {} },
                { type: 'tool_use', name: 'E', input: {} },
              ],
            },
          }),
        ],
        bucketMinutes: 5,
      });

      expect(result).toStrictEqual([
        TimeBucketStub({
          windowStart: '2026-01-01T00:00:00.000Z',
          windowEnd: '2026-01-01T00:05:00.000Z',
          apiResponseCount: 1,
          toolCallCount: 15,
          outputTokens: 0,
          contextInTokens: 0,
          toolResultBytes: 0,
          topTools: [
            { name: 'A', count: 5 },
            { name: 'B', count: 4 },
            { name: 'C', count: 3 },
            { name: 'D', count: 2 },
          ],
        }),
      ]);
    });

    it('EDGE: {two tools with equal counts} => ascending name breaks the tie', () => {
      const result = recordsToBucketsTransformer({
        records: [
          TranscriptRecordStub({
            timestamp: '2026-01-01T00:00:00.000Z',
            message: {
              content: [
                { type: 'tool_use', name: 'Zeta', input: {} },
                { type: 'tool_use', name: 'Alpha', input: {} },
              ],
            },
          }),
        ],
        bucketMinutes: 5,
      });

      expect(result).toStrictEqual([
        TimeBucketStub({
          windowStart: '2026-01-01T00:00:00.000Z',
          windowEnd: '2026-01-01T00:05:00.000Z',
          apiResponseCount: 1,
          toolCallCount: 2,
          outputTokens: 0,
          contextInTokens: 0,
          toolResultBytes: 0,
          topTools: [
            { name: 'Alpha', count: 1 },
            { name: 'Zeta', count: 1 },
          ],
        }),
      ]);
    });
  });

  describe('record type accounting', () => {
    it('VALID: {a user record carrying a toolUseResult} => counted in toolResultBytes but not apiResponseCount', () => {
      const result = recordsToBucketsTransformer({
        records: [
          TranscriptRecordStub({
            type: 'user',
            timestamp: '2026-01-01T00:00:00.000Z',
            message: { content: 'a note' },
            toolUseResult: { ok: true, value: 'abc' },
          }),
        ],
        bucketMinutes: 5,
      });

      expect(result).toStrictEqual([
        TimeBucketStub({
          windowStart: '2026-01-01T00:00:00.000Z',
          windowEnd: '2026-01-01T00:05:00.000Z',
          apiResponseCount: 0,
          toolCallCount: 0,
          outputTokens: 0,
          contextInTokens: 0,
          toolResultBytes: 25,
          topTools: [],
        }),
      ]);
    });

    it('VALID: {an assistant record with no usage} => contributes zero tokens, still counted as an API response', () => {
      const result = recordsToBucketsTransformer({
        records: [
          TranscriptRecordStub({
            timestamp: '2026-01-01T00:00:00.000Z',
            message: { content: 'hi' },
          }),
        ],
      });

      expect(result).toStrictEqual([
        TimeBucketStub({
          windowStart: '2026-01-01T00:00:00.000Z',
          windowEnd: '2026-01-01T00:15:00.000Z',
          apiResponseCount: 1,
          toolCallCount: 0,
          outputTokens: 0,
          contextInTokens: 0,
          toolResultBytes: 0,
          topTools: [],
        }),
      ]);
    });
  });
});
