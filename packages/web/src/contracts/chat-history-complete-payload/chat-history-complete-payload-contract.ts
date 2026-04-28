/**
 * PURPOSE: Defines the payload shape carried by chat-history-complete WebSocket messages consumed by the web client
 *
 * USAGE:
 * chatHistoryCompletePayloadContract.parse({chatProcessId: 'proc-1' as ProcessId});
 * // Returns ChatHistoryCompletePayload
 *
 * `chatProcessId` is optional because two emitters ship this message: ChatReplayResponder
 * stamps its own chatProcessId, while the server's subscribe-quest finisher sends only
 * `{questId}` (it has no single chatProcessId — replay is per-workItem). Both must parse
 * successfully so the web's `isStreaming` flag flips off after either flow completes.
 */

import { z } from 'zod';

import { processIdContract, questIdContract } from '@dungeonmaster/shared/contracts';

export const chatHistoryCompletePayloadContract = z.object({
  chatProcessId: processIdContract.optional(),
  questId: questIdContract.optional(),
});

export type ChatHistoryCompletePayload = z.infer<typeof chatHistoryCompletePayloadContract>;
