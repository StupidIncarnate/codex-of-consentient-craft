/**
 * PURPOSE: The four words a step's outcome derives to, declared WORST FIRST — `wall`, `unmet`,
 * `done`, `empty`. `stepOutcomeContract.options` IS the fold's precedence order:
 * `foldOutcomesTransformer` indexes this array rather than carrying a second copy of the ordering,
 * so a reorder here silently inverts the precedence everywhere it is read.
 *
 * USAGE:
 * stepOutcomeContract.parse('unmet');
 * // Returns 'unmet' as StepOutcome
 */

import { z } from 'zod';

export const stepOutcomeContract = z.enum(['wall', 'unmet', 'done', 'empty']);

export type StepOutcome = z.infer<typeof stepOutcomeContract>;
