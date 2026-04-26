/**
 * PURPOSE: Defines the optional fields the server inspects on chat-output orchestration event payloads
 *
 * USAGE:
 * const parsed = chatOutputPayloadContract.parse(payload);
 * // Returns: { role?: WorkItemRole, slotIndex?: number }
 */

import { z } from 'zod';

export const chatOutputPayloadContract = z
  .object({
    role: z.string().min(1).brand<'WorkItemRoleField'>().optional(),
    slotIndex: z.number().int().nonnegative().brand<'SlotIndexField'>().optional(),
  })
  .passthrough();

export type ChatOutputPayload = z.infer<typeof chatOutputPayloadContract>;
