/**
 * PURPOSE: Defines the optional fields the dev-log formatters can extract from orchestration event payloads
 *
 * USAGE:
 * const parsed = devLogEventPayloadContract.parse(payload);
 * // Returns: { chatProcessId?, processId?, questId?, sessionId?, phase?, slotIndex?, role?, questions?[], entries?[] }
 */

import { z } from 'zod';

export const devLogEventPayloadContract = z
  .object({
    chatProcessId: z.string().min(1).brand<'DevLogProcessId'>().optional(),
    processId: z.string().min(1).brand<'DevLogProcessId'>().optional(),
    questId: z.string().min(1).brand<'DevLogQuestId'>().optional(),
    sessionId: z.string().min(1).brand<'DevLogSessionId'>().optional(),
    phase: z.string().min(1).brand<'DevLogPhase'>().optional(),
    slotIndex: z.number().int().nonnegative().brand<'DevLogSlotIndex'>().optional(),
    role: z.string().min(1).brand<'DevLogRole'>().optional(),
    questions: z.array(z.unknown()).optional(),
    entries: z.array(z.unknown()).optional(),
  })
  .passthrough();

export type DevLogEventPayload = z.infer<typeof devLogEventPayloadContract>;
