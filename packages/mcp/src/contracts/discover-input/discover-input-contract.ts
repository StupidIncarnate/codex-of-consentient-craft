/**
 * PURPOSE: Defines the input schema for the MCP discover tool that searches files in the codebase
 *
 * USAGE:
 * const input: DiscoverInput = discoverInputContract.parse({ glob: 'src/brokers/**' });
 * // Returns validated DiscoverInput with optional filters (glob, grep, verbose, context)
 */
import { z } from 'zod';

export const discoverInputContract = z
  .object({
    glob: z.string().brand<'GlobPattern'>().describe('File path pattern (glob syntax)').optional(),
    grep: z
      .string()
      .brand<'GrepPattern'>()
      .describe(
        'Content regex (JS engine). Supports alternation (a|b), lookaheads ((?!x)), char classes (\\w,\\d,\\s), anchors (^$). Inline flags: (?i) case-insensitive, (?s) dotall. Default is multiline. Invalid regex falls back to escaped literal match.',
      )
      .optional(),
    verbose: z
      .boolean()
      .brand<'Verbose'>()
      .describe('Full details: signature, companions, usage')
      .optional(),
    context: z
      .number()
      .int()
      .nonnegative()
      .brand<'ContextLines'>()
      .describe('Lines of context around grep hits')
      .optional(),
  })
  .strict();

export type DiscoverInput = z.infer<typeof discoverInputContract>;
