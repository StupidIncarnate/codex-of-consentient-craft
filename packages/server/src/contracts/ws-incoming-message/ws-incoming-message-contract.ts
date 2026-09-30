/**
 * PURPOSE: Defines the validated shape of inbound WebSocket messages from the web client
 *
 * USAGE:
 * const parsed = wsIncomingMessageContract.parse(JSON.parse(rawText));
 * // Returns: discriminated union by message type
 */

import { z } from '#gateway/npm/zod';
import { questContract, guildContract, sessionContract } from '@dungeonmaster/shared/contracts';

export const wsIncomingMessageContract = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('replay-history'),
      sessionId: sessionContract.shape.id,
      guildId: guildContract.shape.id,
      chatProcessId: z.string().min(1).brand<'WsIncomingMessageChatProcessId'>(),
    })
    .brand<'WsIncomingMessage'>(),
  z
    .object({
      type: z.literal('ward-detail-request'),
      questId: questContract.shape.id,
      wardResultId: z.string().min(1).brand<'WsIncomingMessageWardResultId'>(),
    })
    .brand<'WsIncomingMessage'>(),
  z
    .object({
      type: z.literal('subscribe-quest'),
      questId: questContract.shape.id,
    })
    .brand<'WsIncomingMessage'>(),
  z
    .object({
      type: z.literal('unsubscribe-quest'),
      questId: questContract.shape.id,
    })
    .brand<'WsIncomingMessage'>(),
  z
    .object({
      type: z.literal('replay-quest-history'),
      questId: questContract.shape.id,
    })
    .brand<'WsIncomingMessage'>(),
]);

export type WsIncomingMessage = z.infer<typeof wsIncomingMessageContract>;
