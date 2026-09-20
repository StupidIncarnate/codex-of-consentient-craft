/**
 * PURPOSE: The one arithmetic constant a transcript's fixed timestamps are built from. It lives
 * here rather than inline in `transcriptTimestampTransformer` because a bare `1000` in an
 * expression is exactly the magic number the statics layer exists to hold.
 *
 * USAGE:
 * transcriptTimeStatics.conversion.msPerSecond;
 * // Returns 1000
 */

export const transcriptTimeStatics = {
  conversion: {
    msPerSecond: 1000,
  },
} as const;
