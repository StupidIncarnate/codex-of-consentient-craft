/**
 * PURPOSE: Defines the result type for the quest-active-session transformer
 *
 * USAGE:
 * const result: ActiveSessionResult = { sessionId: undefined, role: undefined };
 * // Returned by questActiveSessionTransformer
 */

import { z } from 'zod';

import { sessionIdContract, workItemRoleContract } from '@dungeonmaster/shared/contracts';

export const activeSessionResultContract = z.object({
  sessionId: sessionIdContract.optional(),
  role: workItemRoleContract.optional(),
});

export type ActiveSessionResult = z.infer<typeof activeSessionResultContract>;
