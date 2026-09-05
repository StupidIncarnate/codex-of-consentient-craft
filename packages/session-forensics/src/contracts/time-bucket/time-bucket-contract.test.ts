import { timeBucketContract } from './time-bucket-contract';
import { TimeBucketStub } from './time-bucket.stub';

describe('timeBucketContract', () => {
  describe('valid input', () => {
    it('VALID: {busy bucket with several topTools} => returns the branded bucket', () => {
      const result = timeBucketContract.parse({
        windowStart: '2025-01-15T10:00:00.000Z',
        windowEnd: '2025-01-15T10:05:00.000Z',
        apiResponseCount: 41,
        toolCallCount: 27,
        outputTokens: 18_204,
        contextInTokens: 812_009,
        toolResultBytes: 96_432,
        topTools: [
          { name: 'Read', count: 12 },
          { name: 'Edit', count: 9 },
          { name: 'Bash', count: 6 },
        ],
      });

      expect(result).toStrictEqual(
        TimeBucketStub({
          windowStart: '2025-01-15T10:00:00.000Z',
          windowEnd: '2025-01-15T10:05:00.000Z',
          apiResponseCount: 41,
          toolCallCount: 27,
          outputTokens: 18_204,
          contextInTokens: 812_009,
          toolResultBytes: 96_432,
          topTools: [
            { name: 'Read', count: 12 },
            { name: 'Edit', count: 9 },
            { name: 'Bash', count: 6 },
          ],
        }),
      );
    });
  });

  describe('silent bucket', () => {
    it('EMPTY: {every count 0, topTools omitted} => defaults topTools to []', () => {
      const result = timeBucketContract.parse({
        windowStart: '2025-01-15T10:00:00.000Z',
        windowEnd: '2025-01-15T10:05:00.000Z',
        apiResponseCount: 0,
        toolCallCount: 0,
        outputTokens: 0,
        contextInTokens: 0,
        toolResultBytes: 0,
      });

      expect(result).toStrictEqual(
        TimeBucketStub({
          windowStart: '2025-01-15T10:00:00.000Z',
          windowEnd: '2025-01-15T10:05:00.000Z',
          apiResponseCount: 0,
          toolCallCount: 0,
          outputTokens: 0,
          contextInTokens: 0,
          toolResultBytes: 0,
          topTools: [],
        }),
      );
    });
  });

  describe('single top tool', () => {
    it('EDGE: {topTools: one entry} => returns the branded bucket', () => {
      const result = timeBucketContract.parse({
        windowStart: '2025-01-15T10:00:00.000Z',
        windowEnd: '2025-01-15T10:05:00.000Z',
        apiResponseCount: 3,
        toolCallCount: 1,
        outputTokens: 210,
        contextInTokens: 5_000,
        toolResultBytes: 1_024,
        topTools: [{ name: 'Read', count: 1 }],
      });

      expect(result).toStrictEqual(
        TimeBucketStub({
          windowStart: '2025-01-15T10:00:00.000Z',
          windowEnd: '2025-01-15T10:05:00.000Z',
          apiResponseCount: 3,
          toolCallCount: 1,
          outputTokens: 210,
          contextInTokens: 5_000,
          toolResultBytes: 1_024,
          topTools: [{ name: 'Read', count: 1 }],
        }),
      );
    });
  });

  describe('invalid input', () => {
    it('INVALID: {outputTokens: -1} => throws', () => {
      expect(() => TimeBucketStub({ outputTokens: -1 })).toThrow(
        /greater than or equal to 0|Number must be/u,
      );
    });

    it('INVALID: {topTools entry missing count} => throws', () => {
      expect(() => TimeBucketStub({ topTools: [{ name: 'Read' }] as never })).toThrow(/Required/u);
    });
  });

  describe('missing fields', () => {
    it('EMPTY: {no windowStart} => throws', () => {
      expect(() =>
        timeBucketContract.parse({
          windowEnd: '2025-01-15T10:05:00.000Z',
          apiResponseCount: 0,
          toolCallCount: 0,
          outputTokens: 0,
          contextInTokens: 0,
          toolResultBytes: 0,
        }),
      ).toThrow(/Required/u);
    });
  });
});
