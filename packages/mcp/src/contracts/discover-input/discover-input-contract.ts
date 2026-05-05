/**
 * PURPOSE: Defines the input schema for the MCP discover tool that searches files in the codebase
 *
 * USAGE:
 * const input: DiscoverInput = discoverInputContract.parse({ glob: 'src/brokers/**' });
 * // Returns validated DiscoverInput with optional filters (glob, grep, verbose, context)
 */
import { z } from 'zod';

import { coercedBooleanInputContract } from '../coerced-boolean-input/coerced-boolean-input-contract';

export const discoverInputContract = z
  .object({
    glob: z.string().brand<'GlobPattern'>().describe('File path pattern (glob syntax)').optional(),
    grep: z
      .string()
      .brand<'GrepPattern'>()
      .describe(
        'Content regex (JS engine). By default, identifier-like patterns (2+ word tokens, no regex metacharacters) match across naming conventions: `OrchestrationEventType` also hits `orchestration-event-type`, `orchestration_event_type`, `orchestrationEventType`, `ORCHESTRATION_EVENT_TYPE`. Pass `strict: true` to disable this and treat the pattern as a literal regex. Supports alternation (a|b), lookaheads ((?!x)), char classes (\\w,\\d,\\s), anchors (^$). Inline flags: (?i) case-insensitive, (?s) dotall. Default is multiline. Invalid regex falls back to escaped literal match.',
      )
      .optional(),
    verbose: coercedBooleanInputContract
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
    strict: coercedBooleanInputContract
      .brand<'StrictGrep'>()
      .describe(
        'Match grep pattern exactly as a regex/literal. Disables the default cross-naming-convention matching for identifier-like patterns.',
      )
      .optional(),
  })
  .strict();

export type DiscoverInput = z.infer<typeof discoverInputContract>;
