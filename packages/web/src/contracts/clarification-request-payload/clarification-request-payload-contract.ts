/**
 * PURPOSE: Defines the payload shape carried by clarification-request WebSocket messages consumed by the web client
 *
 * USAGE:
 * clarificationRequestPayloadContract.parse({chatProcessId: 'proc-1' as ProcessId, questions: []});
 * // Returns ClarificationRequestPayload with chatProcessId and raw questions
 */

import { z } from 'zod';

import { processIdContract } from '@dungeonmaster/shared/contracts';

export const clarificationRequestPayloadContract = z.object({
  chatProcessId: processIdContract,
  questions: z.unknown(),
});

export type ClarificationRequestPayload = z.infer<typeof clarificationRequestPayloadContract>;
