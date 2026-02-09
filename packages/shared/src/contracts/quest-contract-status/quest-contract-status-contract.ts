/**
 * PURPOSE: Whether this contract is "new" (created by quest), "existing" (already in codebase), or "modified" (existing contract being changed)
 *
 * USAGE:
 * questContractStatusContract.parse('new');
 * // Returns: 'new' as QuestContractStatus
 */

import { z } from 'zod';

export const questContractStatusContract = z
  .enum(['new', 'existing', 'modified'])
  .describe(
    'Whether this contract is "new" (created by quest), "existing" (already in codebase, listed for context), or "modified" (existing contract being changed - properties show FINAL state)',
  );

export type QuestContractStatus = z.infer<typeof questContractStatusContract>;
