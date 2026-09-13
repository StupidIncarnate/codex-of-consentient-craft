/**
 * PURPOSE: Reads a bounded batch of transcript tails, folds their token spend into the running
 *   buckets, and recurses on the rest. Reach for this rather than awaiting inside a loop or
 *   Promise.all-ing the whole list: a full rebuild reads every transcript on the machine, and
 *   opening all of them at once exhausts the process's file handles while holding ~600 MB of
 *   contents in memory at the same time. A batch bounds both.
 *
 * USAGE:
 * await foldBatchLayerBroker({ pending, buckets, oldestUsefulMs, batchSize });
 * // Returns the buckets with every pending file's spend folded in
 */

import type { UsageLedger } from '@dungeonmaster/shared/contracts';
import { filePathContract, usageBucketContract } from '@dungeonmaster/shared/contracts';

import { fsReadFileRangeAdapter } from '../../../adapters/fs/read-file-range/fs-read-file-range-adapter';
import type { TranscriptRead } from '../../../contracts/transcript-read/transcript-read-contract';
import { usageLineToSampleTransformer } from '../../../transformers/usage-line-to-sample/usage-line-to-sample-transformer';

export const foldBatchLayerBroker = async ({
  pending,
  buckets,
  oldestUsefulMs,
  batchSize,
}: {
  pending: readonly TranscriptRead[];
  buckets: UsageLedger['buckets'];
  oldestUsefulMs: number;
  batchSize: number;
}): Promise<UsageLedger['buckets']> => {
  if (pending.length === 0) {
    return buckets;
  }

  const batch = pending.slice(0, batchSize);

  const contents = await Promise.all(
    batch.map(async (entry) =>
      fsReadFileRangeAdapter({
        filePath: filePathContract.parse(entry.path),
        fromByte: entry.fromByte,
      }).catch(() => null),
    ),
  );

  const folded = contents.reduce<UsageLedger['buckets']>((running, body) => {
    if (body === null) {
      return running;
    }

    return body.split('\n').reduce((inner, line) => {
      const sample = usageLineToSampleTransformer({ line });
      if (sample === null || sample.bucketStartMs < oldestUsefulMs) {
        return inner;
      }

      const key = String(sample.bucketStartMs);
      const already = inner[key];

      return {
        ...inner,
        [key]: usageBucketContract.parse({
          input: (already?.input ?? 0) + sample.tokens.input,
          cacheCreation: (already?.cacheCreation ?? 0) + sample.tokens.cacheCreation,
          cacheRead: (already?.cacheRead ?? 0) + sample.tokens.cacheRead,
          output: (already?.output ?? 0) + sample.tokens.output,
        }),
      };
    }, running);
  }, buckets);

  return foldBatchLayerBroker({
    pending: pending.slice(batchSize),
    buckets: folded,
    oldestUsefulMs,
    batchSize,
  });
};
