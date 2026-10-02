/**
 * PURPOSE: Merges outputs from multiple e2e test shards into a single combined shard output result
 *
 * USAGE:
 * e2eShardOutputsMergeTransformer({ shardOutputs });
 * // Returns: E2eShardOutput with merged output, exitCode, signal, passingTests, and openHandles
 */

import {
  e2eShardOutputContract,
  type E2eShardOutput,
} from '../../contracts/e2e-shard-output/e2e-shard-output-contract';

export const e2eShardOutputsMergeTransformer = ({
  shardOutputs,
}: {
  shardOutputs: E2eShardOutput[];
}): E2eShardOutput => {
  if (shardOutputs.length === 0) {
    return e2eShardOutputContract.parse({
      output: '',
      exitCode: 0,
      signal: null,
      passingTests: [],
      openHandles: [],
    });
  }

  if (shardOutputs.length === 1) {
    const [singleShard] = shardOutputs;
    if (singleShard !== undefined) {
      return singleShard;
    }
  }

  const sorted = [...shardOutputs].sort((a, b) => {
    const indexA = a.shardIndex ?? 0;
    const indexB = b.shardIndex ?? 0;
    return indexA - indexB;
  });

  const outputParts: string[] = [];
  for (let index = 0; index < sorted.length; index++) {
    const shard = sorted[index];
    if (shard === undefined) {
      continue;
    }
    const totalShards = shard.shardCount ?? sorted.length;
    const shardIndex = shard.shardIndex ?? index + 1;
    outputParts.push(`--- e2e shard ${shardIndex}/${totalShards} ---\n`);
    outputParts.push(shard.output);
    if (index < sorted.length - 1 && shard.output.length > 0 && !shard.output.endsWith('\n')) {
      outputParts.push('\n');
    }
  }

  const failingShard = sorted.find((shard) => shard.exitCode !== 0);
  const exitCode = failingShard?.exitCode ?? 0;

  const signaledShard = sorted.find((shard) => shard.signal !== null);
  const signal = signaledShard?.signal ?? null;

  const passingTests = sorted.flatMap((shard) => shard.passingTests);
  const openHandles = sorted.flatMap((shard) => shard.openHandles);

  return e2eShardOutputContract.parse({
    output: outputParts.join(''),
    exitCode,
    signal,
    passingTests,
    openHandles,
  });
};
