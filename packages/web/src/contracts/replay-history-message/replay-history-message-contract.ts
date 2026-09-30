/**
 * PURPOSE: Defines the shape of a replay-history WebSocket message sent from the web client to the server
 *
 * USAGE:
 * replayHistoryMessageContract.parse({type: 'replay-history', sessionId: 's-1', guildId: 'g-1', chatProcessId: 'p-1'});
 * // Returns ReplayHistoryMessage — used to inspect outbound WS messages in tests
 */

import { z } from '#gateway/npm/zod';

import { guildContract, sessionContract } from '@dungeonmaster/shared/contracts';

export const replayHistoryMessageContract = z.object({
  type: z.literal('replay-history'),
  sessionId: sessionContract.shape.id,
  guildId: guildContract.shape.id,
  chatProcessId: z.string().min(1).brand<'ReplayHistoryMessageChatProcessId'>(),
}).brand<'ReplayHistoryMessage'>();

export type ReplayHistoryMessage = z.infer<typeof replayHistoryMessageContract>;
