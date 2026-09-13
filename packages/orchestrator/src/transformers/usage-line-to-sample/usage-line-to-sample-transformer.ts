/**
 * PURPOSE: Reads one raw transcript line and returns the token spend it records, placed in its
 *   hour. Returns null for everything else, which is most lines — user turns, tool results,
 *   summaries and system lines carry no usage.
 *
 *   It counts the line WHATEVER session wrote it, main or sub-agent, because quota is billed to
 *   the account rather than to a session. It is also deliberately tolerant: a half-written final
 *   line is normal in a transcript being appended to right now, and must be skipped rather than
 *   aborting the scan of everything before it.
 *
 * USAGE:
 * usageLineToSampleTransformer({ line });
 * // Returns: UsageSample, or null when the line records no token spend
 */

import { usageBucketContract } from '@dungeonmaster/shared/contracts';
import { usageAccountingStatics } from '@dungeonmaster/shared/statics';

import { usageLineShapeContract } from '../../contracts/usage-line-shape/usage-line-shape-contract';
import {
  usageSampleContract,
  type UsageSample,
} from '../../contracts/usage-sample/usage-sample-contract';

export const usageLineToSampleTransformer = ({ line }: { line: string }): UsageSample | null => {
  // A cheap reject before the parse. Running JSON.parse on every line of a 1.8 GB tree is the
  // difference between a scan measured in seconds and one measured in minutes.
  if (!line.includes('"usage"')) {
    return null;
  }

  try {
    const shape = usageLineShapeContract.safeParse(JSON.parse(line));
    if (!shape.success) {
      return null;
    }

    const at = Date.parse(shape.data.timestamp);
    if (Number.isNaN(at)) {
      return null;
    }

    const { usage } = shape.data.message;

    return usageSampleContract.parse({
      bucketStartMs: at - (at % usageAccountingStatics.bucket.durationMs),
      tokens: usageBucketContract.parse({
        input: usage.input_tokens ?? 0,
        cacheCreation: usage.cache_creation_input_tokens ?? 0,
        cacheRead: usage.cache_read_input_tokens ?? 0,
        output: usage.output_tokens ?? 0,
      }),
    });
  } catch {
    // A torn final line in a file a live session is still appending to, or a shape no contract
    // here anticipates. Either way this one line is not measurable and the scan carries on.
    return null;
  }
};
