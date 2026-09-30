/**
 * PURPOSE: Defines the result type for the quest-active-session transformer
 *
 * USAGE:
 * const result: ActiveSessionResult = { sessionId: undefined, role: undefined };
 * // Returned by questActiveSessionTransformer
 */

import { z } from '#gateway/npm/zod';

import { workItemRoleContract, sessionContract } from '@dungeonmaster/shared/contracts';

export const activeSessionResultContract = z.object({
  sessionId: sessionContract.shape.id.optional(),
  role: workItemRoleContract.optional(),
}).brand<'ActiveSessionResult'>();

export type ActiveSessionResult = z.infer<typeof activeSessionResultContract>;
