/**
 * PURPOSE: Defines the output schema for MCP discover tool results with file metadata
 *
 * USAGE:
 * const result: DiscoverResult = discoverResultContract.parse({ results: [...], count: 5 });
 * // Returns validated array of discovered files with metadata and total count
 */
import { z } from 'zod';
import { discoverResultItemContract } from '../discover-result-item/discover-result-item-contract';

export const discoverResultContract = z.object({
  results: z.array(discoverResultItemContract),
  count: z.number().int().brand<'ResultCount'>(),
});

export type DiscoverResult = z.infer<typeof discoverResultContract>;
