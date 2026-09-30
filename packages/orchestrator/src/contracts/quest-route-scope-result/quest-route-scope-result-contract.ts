/**
 * PURPOSE: Defines the data `questRouteScopeBroker` returns
 *
 * USAGE:
 * questRouteScopeResultContract.parse(value);
 * // Returns validated QuestRouteScopeResult
 */
import { z } from '#gateway/npm/zod';

export const questRouteScopeResultContract = z
  .object({ routed: z.boolean(), blocked: z.boolean() })
  .brand<'QuestRouteScopeResult'>();

export type QuestRouteScopeResult = z.infer<typeof questRouteScopeResultContract>;
