/**
 * PURPOSE: Defines the payload shape carried by chat-history-complete WebSocket messages consumed by the web client
 *
 * USAGE:
 * chatHistoryCompletePayloadContract.parse({chatProcessId: 'proc-1' as ProcessId});
 * // Returns ChatHistoryCompletePayload
 */

import { z } from 'zod';

import { processIdContract } from '@dungeonmaster/shared/contracts';

export const chatHistoryCompletePayloadContract = z.object({
  chatProcessId: processIdContract,
});

export type ChatHistoryCompletePayload = z.infer<typeof chatHistoryCompletePayloadContract>;
