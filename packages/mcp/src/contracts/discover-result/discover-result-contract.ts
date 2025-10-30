/**
 * PURPOSE: Defines the output schema for MCP discover tool results with file metadata
 *
 * USAGE:
 * const result: DiscoverResult = discoverResultContract.parse({ results: [...], count: 5 });
 * // Returns validated array of discovered files with metadata and total count
 */
import { z } from 'zod';

const discoverResultItemContract = z.object({
  name: z.string().brand<'FunctionName'>(),
  path: z.string().brand<'AbsoluteFilePath'>(),
  type: z.string().brand<'FileType'>(),
  purpose: z.string().brand<'Purpose'>().optional(),
  usage: z.string().brand<'UsageExample'>().optional(),
  signature: z.string().brand<'FunctionSignature'>().optional(),
});

export const discoverResultContract = z.object({
  results: z.array(discoverResultItemContract),
  count: z.number().int().brand<'ResultCount'>(),
});

export type DiscoverResult = z.infer<typeof discoverResultContract>;
