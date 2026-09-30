/**
 * PURPOSE: Defines the data `mcpDiscoverBroker` returns
 *
 * USAGE:
 * mcpDiscoverResultContract.parse(value);
 * // Returns validated McpDiscoverResult
 */
import { z } from '#gateway/npm/zod';
import { discoverResultItemContract } from '../discover-result-item/discover-result-item-contract';

export const mcpDiscoverResultContract = z
  .object({
    results: z.union([
      z.array(discoverResultItemContract),
      z.string().brand<'McpDiscoverResultResults'>(),
    ]),
    count: z.number().brand<'McpDiscoverResultCount'>(),
  })
  .brand<'McpDiscoverResult'>();

export type McpDiscoverResult = z.infer<typeof mcpDiscoverResultContract>;
