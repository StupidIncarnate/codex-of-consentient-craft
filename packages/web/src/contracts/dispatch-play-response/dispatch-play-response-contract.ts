/**
 * PURPOSE: Validates the response body of POST /api/orchestration/dispatch/play — both the
 * 200 `{allowed: true, state}` success shape and the 409 `{allowed: false, reason, state}`
 * denial shape, so callers can branch on `allowed` and surface `reason` to the user.
 *
 * USAGE:
 * dispatchPlayResponseContract.parse({ allowed: false, reason: 'MCP loop owns the queue', state });
 * // Returns DispatchPlayResponse
 */

import { z } from 'zod';

import { dispatchStateContract } from '@dungeonmaster/shared/contracts';

export const dispatchPlayResponseContract = z.object({
  allowed: z.boolean(),
  reason: z.string().min(1).brand<'DispatchDenyReason'>().optional(),
  state: dispatchStateContract,
});

export type DispatchPlayResponse = z.infer<typeof dispatchPlayResponseContract>;
