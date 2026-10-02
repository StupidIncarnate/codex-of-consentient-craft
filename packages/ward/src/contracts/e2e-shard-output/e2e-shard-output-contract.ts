/**
 * PURPOSE: Defines the execution output of a single e2e test shard or merged shard results
 *
 * USAGE:
 * e2eShardOutputContract.parse({
 *   shardIndex: 1,
 *   shardCount: 3,
 *   output: '...',
 *   exitCode: 0,
 *   signal: null,
 *   passingTests: [],
 *   openHandles: [],
 * });
 * // Returns: E2eShardOutput validated object
 */

import { z } from '#gateway/npm/zod';
import { openHandleContract } from '../open-handle/open-handle-contract';
import { passingTestContract } from '../passing-test/passing-test-contract';

export const e2eShardOutputContract = z
  .object({
    shardIndex: z.number().int().nonnegative().brand<'E2eShardOutputShardIndex'>().optional(),
    shardCount: z.number().int().positive().brand<'E2eShardOutputShardCount'>().optional(),
    output: z.string().brand<'E2eShardOutputOutput'>(),
    exitCode: z.number().int().brand<'E2eShardOutputExitCode'>(),
    signal: z
      .custom<NodeJS.Signals>((value) => typeof value === 'string' && value.length > 0)
      .nullable()
      .default(null),
    passingTests: z.array(passingTestContract).default([]),
    openHandles: z.array(openHandleContract).default([]),
  })
  .brand<'E2eShardOutput'>();

export type E2eShardOutput = z.infer<typeof e2eShardOutputContract>;
