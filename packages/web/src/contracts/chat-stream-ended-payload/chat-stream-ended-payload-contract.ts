/**
 * PURPOSE: Unified payload for chatStreamEnded$ — the channel surface that merges chat-complete and chat-history-complete wire events into a single typed observable. Carries the superset of both wire payloads' fields so consumers (chat binding, session-replay binding) read whichever ones their wire frame supplied.
 *
 * USAGE:
 * chatStreamEndedPayloadContract.parse({chatProcessId: 'proc-1' as ProcessId});
 * // Returns ChatStreamEndedPayload — every field optional; emitted with whatever fields the source wire frame populated.
 */

import { z } from 'zod';

import {
  processIdContract,
  questIdContract,
  sessionIdContract,
} from '@dungeonmaster/shared/contracts';

export const chatStreamEndedPayloadContract = z.object({
  chatProcessId: processIdContract.optional(),
  sessionId: sessionIdContract.optional(),
  questId: questIdContract.optional(),
});

export type ChatStreamEndedPayload = z.infer<typeof chatStreamEndedPayloadContract>;
