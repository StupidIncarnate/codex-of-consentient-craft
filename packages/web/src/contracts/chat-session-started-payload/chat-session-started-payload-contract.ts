/**
 * PURPOSE: Defines the payload shape carried by chat-session-started WebSocket messages consumed by the web client
 *
 * USAGE:
 * chatSessionStartedPayloadContract.parse({chatProcessId: 'proc-1' as ProcessId, sessionId: 'sess-1' as SessionId});
 * // Returns ChatSessionStartedPayload
 */

import { z } from 'zod';

import { processIdContract, sessionIdContract } from '@dungeonmaster/shared/contracts';

export const chatSessionStartedPayloadContract = z.object({
  chatProcessId: processIdContract,
  sessionId: sessionIdContract,
});

export type ChatSessionStartedPayload = z.infer<typeof chatSessionStartedPayloadContract>;
