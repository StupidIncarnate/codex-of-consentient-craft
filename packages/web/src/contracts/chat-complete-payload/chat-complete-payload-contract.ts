/**
 * PURPOSE: Defines the payload shape carried by chat-complete WebSocket messages consumed by the web client
 *
 * USAGE:
 * chatCompletePayloadContract.parse({chatProcessId: 'proc-1' as ProcessId});
 * // Returns ChatCompletePayload with optional sessionId
 */

import { z } from 'zod';

import { processIdContract, sessionIdContract } from '@dungeonmaster/shared/contracts';

export const chatCompletePayloadContract = z.object({
  chatProcessId: processIdContract,
  sessionId: sessionIdContract.optional().catch(undefined),
});

export type ChatCompletePayload = z.infer<typeof chatCompletePayloadContract>;
