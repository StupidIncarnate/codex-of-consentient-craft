/**
 * PURPOSE: Defines the payload shape carried by quest-by-session-not-found WebSocket messages consumed by the web client
 *
 * USAGE:
 * questBySessionNotFoundPayloadContract.parse({sessionId: 'sess-1' as SessionId});
 * // Returns QuestBySessionNotFoundPayload
 */

import { z } from 'zod';

import { sessionIdContract } from '@dungeonmaster/shared/contracts';

export const questBySessionNotFoundPayloadContract = z.object({
  sessionId: sessionIdContract,
});

export type QuestBySessionNotFoundPayload = z.infer<typeof questBySessionNotFoundPayloadContract>;
