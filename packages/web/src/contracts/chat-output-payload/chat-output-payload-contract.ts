/**
 * PURPOSE: Defines the payload shape carried by chat-output WebSocket messages consumed by the web client.
 * questId + workItemId are optional to support both live quest emissions (which carry them) and orphan
 * session replay emissions (which carry chatProcessId only and do not carry questId/workItemId).
 *
 * `replay` is the flag that separates a transcript being read back off disk from an agent actually
 * emitting — the two are otherwise identical chat-output frames on the same quest subscription, and
 * only the emitter knows which it is. Consumers tracking "is a turn running" must ignore replayed
 * frames; consumers rendering the transcript must not.
 *
 * USAGE:
 * chatOutputPayloadContract.parse({chatProcessId: 'proc-1' as ProcessId, entries: [], questId: '...' as QuestId, workItemId: '...' as QuestWorkItemId});
 * // Returns ChatOutputPayload with optional questId + workItemId, optional sessionId, chatProcessId, replay, and slotIndex.
 */

import { z } from '#gateway/npm/zod';

import { chatEntryContract, questContract, sessionContract, workItemContract } from '@dungeonmaster/shared/contracts';

export const chatOutputPayloadContract = z.object({
  chatProcessId: z.string().min(1).brand<'ChatOutputPayloadChatProcessId'>().optional(),
  entries: z.array(chatEntryContract),
  sessionId: sessionContract.shape.id.optional(),
  questId: questContract.shape.id.optional(),
  workItemId: workItemContract.shape.id.optional(),
  replay: z.boolean().optional(),
  slotIndex: z.number().int().nonnegative().brand<'ChatOutputPayloadSlotIndex'>().optional(),
}).brand<'ChatOutputPayload'>();

export type ChatOutputPayload = z.infer<typeof chatOutputPayloadContract>;
