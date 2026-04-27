/**
 * PURPOSE: Defines the validated shape of inbound WebSocket messages from the web client
 *
 * USAGE:
 * const parsed = wsIncomingMessageContract.parse(JSON.parse(rawText));
 * // Returns: discriminated union by message type
 */

import { z } from 'zod';
import {
  guildIdContract,
  processIdContract,
  questIdContract,
  sessionIdContract,
} from '@dungeonmaster/shared/contracts';

export const wsIncomingMessageContract = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('replay-history'),
    sessionId: sessionIdContract,
    guildId: guildIdContract,
    chatProcessId: processIdContract,
  }),
  z.object({
    type: z.literal('quest-by-session-request'),
    sessionId: sessionIdContract,
    guildId: guildIdContract,
  }),
  z.object({
    type: z.literal('ward-detail-request'),
    questId: questIdContract,
    wardResultId: z.string().min(1).brand<'WardResultIdRaw'>(),
  }),
  z.object({
    type: z.literal('subscribe-quest'),
    questId: questIdContract,
  }),
  z.object({
    type: z.literal('unsubscribe-quest'),
    questId: questIdContract,
  }),
  z.object({
    type: z.literal('replay-quest-history'),
    questId: questIdContract,
  }),
]);

export type WsIncomingMessage = z.infer<typeof wsIncomingMessageContract>;
