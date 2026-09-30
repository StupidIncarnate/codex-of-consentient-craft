/**
 * PURPOSE: Defines the validated shape of inbound WebSocket messages from the web client
 *
 * USAGE:
 * const parsed = wsIncomingMessageContract.parse(JSON.parse(rawText));
 * // Returns: discriminated union by message type
 */

import { z } from '#gateway/npm/zod';
import { processIdContract, sessionIdContract, questContract, guildContract } from '@dungeonmaster/shared/contracts';

export const wsIncomingMessageContract = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('replay-history'),
    sessionId: sessionIdContract,
    guildId: guildContract.shape.id,
    chatProcessId: processIdContract,
  }),
  z.object({
    type: z.literal('ward-detail-request'),
    questId: questContract.shape.id,
    wardResultId: z.string().min(1).brand<'WardResultIdRaw'>(),
  }),
  z.object({
    type: z.literal('subscribe-quest'),
    questId: questContract.shape.id,
  }),
  z.object({
    type: z.literal('unsubscribe-quest'),
    questId: questContract.shape.id,
  }),
  z.object({
    type: z.literal('replay-quest-history'),
    questId: questContract.shape.id,
  }),
]);

export type WsIncomingMessage = z.infer<typeof wsIncomingMessageContract>;
