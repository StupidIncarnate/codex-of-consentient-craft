/**
 * PURPOSE: Response of the Node-dispatcher play/pause responders — whether the request took
 * effect, the refusal reason when the exclusivity gate blocked it, and the resulting
 * (or unchanged) dispatch state.
 *
 * USAGE:
 * dispatchPlayResponseContract.parse({ allowed: true, state: { mode: 'node-playing', updatedAt } });
 * // Returns: DispatchPlayResponse
 */

import { z } from 'zod';

import { dispatchStateContract } from '@dungeonmaster/shared/contracts';

export const dispatchPlayResponseContract = z.object({
  allowed: z.boolean(),
  reason: z.string().min(1).brand<'DispatchPlayRefusalReason'>().optional(),
  state: dispatchStateContract,
});

export type DispatchPlayResponse = z.infer<typeof dispatchPlayResponseContract>;
