/**
 * PURPOSE: Defines the shape orchestration-loop responders construct for chat-output orchestration events emitted on the in-memory event bus
 *
 * USAGE:
 * chatOutputEmitPayloadContract.parse({ processId, slotIndex, entries, sessionId, chatProcessId });
 * // Returns: { processId, slotIndex, entries, sessionId?, chatProcessId? }
 */

import { z } from 'zod';

import {
  chatEntryContract,
  processIdContract,
  sessionIdContract,
} from '@dungeonmaster/shared/contracts';

import { slotIndexContract } from '../slot-index/slot-index-contract';

export const chatOutputEmitPayloadContract = z.object({
  processId: processIdContract,
  slotIndex: slotIndexContract,
  entries: z.array(chatEntryContract),
  sessionId: sessionIdContract.optional(),
  chatProcessId: processIdContract.optional(),
});

export type ChatOutputEmitPayload = z.infer<typeof chatOutputEmitPayloadContract>;
