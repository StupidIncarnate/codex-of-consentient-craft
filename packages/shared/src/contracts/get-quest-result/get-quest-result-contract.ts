/**
 * PURPOSE: Defines the output schema for the quest get operation result
 *
 * USAGE:
 * const result: GetQuestResult = getQuestResultContract.parse({ success: true, quest: {...} });
 * // Returns validated GetQuestResult with success status and quest or error
 *
 * `flowSlice` is present ONLY when the caller passed `flowId` or `packageName`, and it is already
 * RENDERED. It carries text rather than a narrowed Quest because the slice is defined by what it
 * SAYS about a flow — foreign observables collapsed to a count, a cross-flow edge's target resolved
 * out of a flow the caller cannot see — and none of that survives as a subset of the quest object.
 * `quest` is still populated beside it, so a caller reading the JSON is never handed less than
 * before.
 */
import { z } from 'zod';

import { contentTextContract } from '../content-text/content-text-contract';
import { questContract } from '../quest/quest-contract';

export const getQuestResultContract = z
  .object({
    success: z.boolean(),
    quest: questContract.optional(),
    flowSlice: contentTextContract.optional(),
    error: z.string().brand<'ErrorMessage'>().optional(),
  })
  .brand<'GetQuestResult'>();

export type GetQuestResult = z.infer<typeof getQuestResultContract>;
