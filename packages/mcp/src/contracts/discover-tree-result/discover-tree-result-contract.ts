/**
 * PURPOSE: Defines the output schema for MCP discover tool tree format results
 *
 * USAGE:
 * const result: DiscoverTreeResult = discoverTreeResultContract.parse({ results: 'guards/\n  ...', count: 5 });
 * // Returns validated tree format string with count
 */
import { z } from 'zod';
import { treeOutputContract } from '../tree-output/tree-output-contract';
import { resultCountContract } from '../result-count/result-count-contract';

export const discoverTreeResultContract = z.object({
  results: treeOutputContract,
  count: resultCountContract,
});

export type DiscoverTreeResult = z.infer<typeof discoverTreeResultContract>;
