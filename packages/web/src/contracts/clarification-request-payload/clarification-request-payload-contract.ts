/**
 * PURPOSE: Defines the payload shape carried by clarification-request WebSocket messages consumed by the web client
 *
 * USAGE:
 * clarificationRequestPayloadContract.parse({chatProcessId: 'proc-1' as ProcessId, questions: []});
 * // Returns ClarificationRequestPayload with chatProcessId and raw questions
 */

import { z } from '#gateway/npm/zod';


export const clarificationRequestPayloadContract = z.object({
  chatProcessId: z.string().min(1).brand<'ClarificationRequestPayloadChatProcessId'>(),
  questions: z.unknown(),
}).brand<'ClarificationRequestPayload'>();

export type ClarificationRequestPayload = z.infer<typeof clarificationRequestPayloadContract>;
