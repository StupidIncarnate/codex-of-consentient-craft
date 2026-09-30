/**
 * PURPOSE: Extracts an ISO timestamp from a normalized (camelCase) Claude line object, falling back to epoch if absent or invalid
 *
 * USAGE:
 * extractTimestampFromJsonlLineTransformer({ parsed: {timestamp:'2025-01-01T00:00:00.000Z'} });
 * // Returns IsoTimestamp '2025-01-01T00:00:00.000Z'
 */

import { z } from '#gateway/npm/zod';

import { normalizedStreamLineContract } from '../../contracts/normalized-stream-line/normalized-stream-line-contract';

const EPOCH_FALLBACK = '1970-01-01T00:00:00.000Z';

export const extractTimestampFromJsonlLineTransformer = ({
  parsed,
}: {
  parsed: unknown;
}): string => {
  const lineParse = normalizedStreamLineContract.safeParse(parsed);
  if (!lineParse.success) {
    return EPOCH_FALLBACK;
  }
  const raw = lineParse.data.timestamp;
  if (typeof raw === 'string') {
    const parseResult = z.iso.datetime().safeParse(raw);
    if (parseResult.success) {
      return parseResult.data;
    }
  }

  return EPOCH_FALLBACK;
};
