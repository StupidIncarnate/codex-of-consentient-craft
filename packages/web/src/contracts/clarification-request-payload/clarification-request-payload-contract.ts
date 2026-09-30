/**
 * PURPOSE: Defines the payload shape carried by clarification-request WebSocket messages consumed by the web client
 *
 * USAGE:
 * clarificationRequestPayloadContract.parse({chatProcessId: 'proc-1', questions: [{question: 'Pick one', header: 'Choice', options: [{label: 'A', description: 'Option A'}], multiSelect: false}]});
 * // Returns ClarificationRequestPayload with chatProcessId and the parsed questions
 */

import { askUserQuestionContract } from '@dungeonmaster/shared/contracts';

import { z } from '#gateway/npm/zod';

export const clarificationRequestPayloadContract = z
  .object({
    chatProcessId: z.string().min(1).brand<'ClarificationRequestPayloadChatProcessId'>(),
    questions: askUserQuestionContract.shape.questions,
  })
  .brand<'ClarificationRequestPayload'>();

export type ClarificationRequestPayload = z.infer<typeof clarificationRequestPayloadContract>;
