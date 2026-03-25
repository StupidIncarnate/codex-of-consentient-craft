/**
 * PURPOSE: Extracts an ISO timestamp from a raw JSONL line, falling back to epoch if absent or invalid
 *
 * USAGE:
 * extractTimestampFromJsonlLineTransformer({ line: StreamJsonLineStub({ value: '{"timestamp":"2025-01-01T00:00:00.000Z"}' }) });
 * // Returns IsoTimestamp '2025-01-01T00:00:00.000Z'
 */

import type { IsoTimestamp } from '../../contracts/iso-timestamp/iso-timestamp-contract';
import { isoTimestampContract } from '../../contracts/iso-timestamp/iso-timestamp-contract';
import type { StreamJsonLine } from '@dungeonmaster/shared/contracts';

const EPOCH_FALLBACK = isoTimestampContract.parse('1970-01-01T00:00:00.000Z');

export const extractTimestampFromJsonlLineTransformer = ({
  line,
}: {
  line: StreamJsonLine;
}): IsoTimestamp => {
  try {
    const parsed: unknown = JSON.parse(line);
    if (typeof parsed === 'object' && parsed !== null && 'timestamp' in parsed) {
      const raw: unknown = Reflect.get(parsed, 'timestamp');
      if (typeof raw === 'string') {
        return isoTimestampContract.parse(raw);
      }
    }
  } catch {
    // fall through to default
  }

  return EPOCH_FALLBACK;
};
