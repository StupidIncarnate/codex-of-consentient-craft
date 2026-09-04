/**
 * PURPOSE: A session total hides that most of the spend usually lands in one or two windows.
 * Context-in tokens are everything sent into one API request: fresh input, cache reads and cache
 * writes together. On one measured session, 66 of 104 API responses and 7.2M of 15.2M context-in
 * tokens fell inside a single five-minute window. A session total cannot show that concentration on
 * its own. This transformer is what the `buckets` command uses. It slices the session into
 * fixed-width windows anchored to the earliest timestamp. It emits one row per window that actually
 * saw activity. It drops a silent window rather than print it as a zero row, because printing every
 * window would flood a multi-hour session with empty rows.
 *
 * USAGE:
 * recordsToBucketsTransformer({ records });
 * // Returns one TimeBucket per non-empty bucketMinutes-wide window, oldest first
 */
import {
  timeBucketContract,
  type TimeBucket,
} from '../../contracts/time-bucket/time-bucket-contract';
import { recordToTokenUsageTransformer } from '../record-to-token-usage/record-to-token-usage-transformer';
import { recordToContentBlocksTransformer } from '../record-to-content-blocks/record-to-content-blocks-transformer';
import { digestDefaultStatics } from '../../statics/digest-default/digest-default-statics';
import type { TranscriptRecord } from '../../contracts/transcript-record/transcript-record-contract';
import type { TranscriptRecordContentBlock } from '../../contracts/transcript-record-content-block/transcript-record-content-block-contract';

const MILLISECONDS_PER_MINUTE = 60_000;
const TOP_TOOLS_LIMIT = 4;

type Count = ReturnType<typeof Number>;
type BucketIndex = ReturnType<typeof Number>;
type ToolName = NonNullable<TranscriptRecordContentBlock['name']> | '?';

export const recordsToBucketsTransformer = ({
  records,
  bucketMinutes = digestDefaultStatics.bucketMinutes,
}: {
  records: readonly TranscriptRecord[];
  bucketMinutes?: number;
}): readonly TimeBucket[] => {
  const timestamped = records.flatMap((record) =>
    record.timestamp === undefined
      ? []
      : [{ record, timeMs: new Date(record.timestamp).getTime() }],
  );

  if (timestamped.length === 0) {
    return [];
  }

  const widthMs = bucketMinutes * MILLISECONDS_PER_MINUTE;
  const startMs = Math.min(...timestamped.map((entry) => entry.timeMs));

  const buckets = new Map<
    BucketIndex,
    {
      apiResponseCount: Count;
      toolCallCount: Count;
      outputTokens: Count;
      contextInTokens: Count;
      toolResultBytes: Count;
      toolCounts: Map<ToolName, Count>;
    }
  >();

  for (const { record, timeMs } of timestamped) {
    const index = Math.floor((timeMs - startMs) / widthMs);
    const bucket = buckets.get(index) ?? {
      apiResponseCount: 0,
      toolCallCount: 0,
      outputTokens: 0,
      contextInTokens: 0,
      toolResultBytes: 0,
      toolCounts: new Map<ToolName, Count>(),
    };

    if (record.type === 'assistant') {
      bucket.apiResponseCount += 1;

      const usage = recordToTokenUsageTransformer({ record });
      bucket.outputTokens += usage.outputTokens;
      bucket.contextInTokens +=
        usage.inputTokens + usage.cacheReadTokens + usage.cacheCreationTokens;

      const toolUseBlocks = recordToContentBlocksTransformer({ record }).filter(
        (block) => block.type === 'tool_use',
      );
      bucket.toolCallCount += toolUseBlocks.length;
      for (const block of toolUseBlocks) {
        const name = block.name ?? '?';
        bucket.toolCounts.set(name, (bucket.toolCounts.get(name) ?? 0) + 1);
      }
    }

    if (record.toolUseResult !== undefined) {
      bucket.toolResultBytes += JSON.stringify(record.toolUseResult).length;
    }

    buckets.set(index, bucket);
  }

  return [...buckets.entries()]
    .sort(([indexA], [indexB]) => indexA - indexB)
    .map(([index, bucket]) => {
      const windowStartMs = startMs + index * widthMs;

      const topTools = [...bucket.toolCounts.entries()]
        .sort(([nameA, countA], [nameB, countB]) =>
          countA === countB ? nameA.localeCompare(nameB) : countB - countA,
        )
        .slice(0, TOP_TOOLS_LIMIT)
        .map(([name, count]) => ({ name, count }));

      return timeBucketContract.parse({
        windowStart: new Date(windowStartMs).toISOString(),
        windowEnd: new Date(windowStartMs + widthMs).toISOString(),
        apiResponseCount: bucket.apiResponseCount,
        toolCallCount: bucket.toolCallCount,
        outputTokens: bucket.outputTokens,
        contextInTokens: bucket.contextInTokens,
        toolResultBytes: bucket.toolResultBytes,
        topTools,
      });
    });
};
