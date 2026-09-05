/**
 * PURPOSE: The `buckets` CLI command needs a fixed-width table on a terminal, not an array of
 * `TimeBucket` objects that each caller lays out for itself. This transformer is the one place
 * that renders that table. Every consumer then sees the same column widths, the same UTC clock
 * rendering, and the same thousands separators, no matter which window's numbers happen to be
 * biggest.
 *
 * USAGE:
 * bucketsToTextTransformer({ buckets: [TimeBucketStub()] });
 * // Returns a ContentText: a header naming each column in plain words, then one row per bucket
 */
import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';
import type { TimeBucket } from '../../contracts/time-bucket/time-bucket-contract';

const HEADER =
  'Window (UTC)        Replies  Tool calls   Tokens out     Tokens in  Bytes from tools  Busiest tools';

const WINDOW_WIDTH = 20;
const APIS_WIDTH = 7;
const APIS_GAP = 2;
const CALLS_WIDTH = 10;
const CALLS_GAP = 3;
const OUT_TOK_WIDTH = 10;
const OUT_TOK_GAP = 4;
const CTX_IN_WIDTH = 10;
const CTX_IN_GAP = 2;
const RESULT_BYTES_WIDTH = 16;
const RESULT_BYTES_GAP = 2;

// An ISO datetime string ('2025-01-15T10:00:00.000Z') carries 'HH:MM' at a fixed position:
// characters 11 to 16.
const ISO_CLOCK_START = 11;
const ISO_CLOCK_END = 16;

export const bucketsToTextTransformer = ({
  buckets,
}: {
  buckets: readonly TimeBucket[];
}): ContentText =>
  contentTextContract.parse(
    [
      HEADER,
      ...buckets.map((bucket) => {
        const windowStartClock = new Date(bucket.windowStart)
          .toISOString()
          .slice(ISO_CLOCK_START, ISO_CLOCK_END);
        const windowEndClock = new Date(bucket.windowEnd)
          .toISOString()
          .slice(ISO_CLOCK_START, ISO_CLOCK_END);

        const topTools = bucket.topTools
          .map(({ name, count }) => `${name}x${count.toLocaleString('en-US')}`)
          .join(', ');

        return (
          `${windowStartClock}-${windowEndClock}`.padEnd(WINDOW_WIDTH) +
          bucket.apiResponseCount.toLocaleString('en-US').padStart(APIS_WIDTH) +
          ' '.repeat(APIS_GAP) +
          bucket.toolCallCount.toLocaleString('en-US').padStart(CALLS_WIDTH) +
          ' '.repeat(CALLS_GAP) +
          bucket.outputTokens.toLocaleString('en-US').padStart(OUT_TOK_WIDTH) +
          ' '.repeat(OUT_TOK_GAP) +
          bucket.contextInTokens.toLocaleString('en-US').padStart(CTX_IN_WIDTH) +
          ' '.repeat(CTX_IN_GAP) +
          bucket.toolResultBytes.toLocaleString('en-US').padStart(RESULT_BYTES_WIDTH) +
          ' '.repeat(RESULT_BYTES_GAP) +
          topTools
        );
      }),
    ].join('\n'),
  );
