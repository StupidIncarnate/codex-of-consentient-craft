import { bucketsToTextTransformer } from './buckets-to-text-transformer';
import { TimeBucketStub } from '../../contracts/time-bucket/time-bucket.stub';

const HEADER_LINE =
  'Window (UTC)        Replies  Tool calls   Tokens out     Tokens in  Bytes from tools  Busiest tools';

describe('bucketsToTextTransformer', () => {
  describe('three buckets', () => {
    it('VALID: {three buckets, one with two top tools, one silent} => header plus one row per bucket', () => {
      const buckets = [
        TimeBucketStub({
          windowStart: '2025-01-15T10:00:00.000Z',
          windowEnd: '2025-01-15T10:05:00.000Z',
          apiResponseCount: 12,
          toolCallCount: 8,
          outputTokens: 4500,
          contextInTokens: 120_000,
          toolResultBytes: 34_000,
          topTools: [{ name: 'Read', count: 5 }],
        }),
        TimeBucketStub({
          windowStart: '2025-01-15T10:05:00.000Z',
          windowEnd: '2025-01-15T10:10:00.000Z',
          apiResponseCount: 6,
          toolCallCount: 3,
          outputTokens: 1000,
          contextInTokens: 20_000,
          toolResultBytes: 500,
          topTools: [
            { name: 'Edit', count: 2 },
            { name: 'Bash', count: 1 },
          ],
        }),
        TimeBucketStub({
          windowStart: '2025-01-15T10:10:00.000Z',
          windowEnd: '2025-01-15T10:15:00.000Z',
          apiResponseCount: 1,
          toolCallCount: 0,
          outputTokens: 0,
          contextInTokens: 0,
          toolResultBytes: 0,
          topTools: [],
        }),
      ];

      const result = bucketsToTextTransformer({ buckets });

      expect(String(result)).toBe(
        [
          HEADER_LINE,
          '10:00-10:05              12           8        4,500       120,000            34,000  Readx5',
          '10:05-10:10               6           3        1,000        20,000               500  Editx2, Bashx1',
          '10:10-10:15               1           0            0             0                 0  ',
        ].join('\n'),
      );
    });
  });

  describe('empty input', () => {
    it('EMPTY: {buckets: []} => returns the header row alone', () => {
      const result = bucketsToTextTransformer({ buckets: [] });

      expect(String(result)).toBe(HEADER_LINE);
    });
  });

  describe('no top tools', () => {
    it('EDGE: {topTools: []} => row ends with no tool text', () => {
      const buckets = [
        TimeBucketStub({
          windowStart: '2025-01-15T10:10:00.000Z',
          windowEnd: '2025-01-15T10:15:00.000Z',
          apiResponseCount: 1,
          toolCallCount: 0,
          outputTokens: 0,
          contextInTokens: 0,
          toolResultBytes: 0,
          topTools: [],
        }),
      ];

      const result = bucketsToTextTransformer({ buckets });

      expect(String(result)).toBe(
        [
          HEADER_LINE,
          '10:10-10:15               1           0            0             0                 0  ',
        ].join('\n'),
      );
    });
  });

  describe('large counts', () => {
    it('EDGE: {counts in the hundreds of thousands and millions} => thousands separators, columns stay aligned', () => {
      const buckets = [
        TimeBucketStub({
          windowStart: '2025-06-01T14:00:00.000Z',
          windowEnd: '2025-06-01T14:05:00.000Z',
          apiResponseCount: 66,
          toolCallCount: 120,
          outputTokens: 850_000,
          contextInTokens: 7_200_000,
          toolResultBytes: 452_000,
          topTools: [{ name: 'Read', count: 40 }],
        }),
      ];

      const result = bucketsToTextTransformer({ buckets });

      expect(String(result)).toBe(
        [
          HEADER_LINE,
          '14:00-14:05              66         120      850,000     7,200,000           452,000  Readx40',
        ].join('\n'),
      );
    });
  });

  describe('top tools tiebreak', () => {
    it('EDGE: {two tools with equal counts} => rendered in the order the bucket already carries them, ascending by name', () => {
      const buckets = [
        TimeBucketStub({
          windowStart: '2025-01-15T10:00:00.000Z',
          windowEnd: '2025-01-15T10:05:00.000Z',
          apiResponseCount: 2,
          toolCallCount: 2,
          outputTokens: 0,
          contextInTokens: 0,
          toolResultBytes: 0,
          topTools: [
            { name: 'Alpha', count: 1 },
            { name: 'Zeta', count: 1 },
          ],
        }),
      ];

      const result = bucketsToTextTransformer({ buckets });

      expect(String(result)).toBe(
        [
          HEADER_LINE,
          '10:00-10:05               2           2            0             0                 0  Alphax1, Zetax1',
        ].join('\n'),
      );
    });
  });
});
