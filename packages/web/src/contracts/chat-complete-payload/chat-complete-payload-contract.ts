/**
 * PURPOSE: Defines the payload shape carried by chat-complete WebSocket messages consumed by the web client
 *
 * USAGE:
 * chatCompletePayloadContract.parse({chatProcessId: 'proc-1' as ProcessId});
 * // Returns ChatCompletePayload with optional sessionId
 *
 * `retained` marks a frame the server re-sent at the end of a `subscribe-quest` for a turn that
 * had already ended — the only route a completion has to a browser that was not listening when it
 * fired, since nothing writes a completion to disk for the subscribe replay to re-read.
 */

import { z } from 'zod';

import { processIdContract, sessionIdContract } from '@dungeonmaster/shared/contracts';

export const chatCompletePayloadContract = z.object({
  chatProcessId: processIdContract,
  sessionId: sessionIdContract.optional().catch(undefined),
  retained: z.boolean().optional(),
});

export type ChatCompletePayload = z.infer<typeof chatCompletePayloadContract>;
