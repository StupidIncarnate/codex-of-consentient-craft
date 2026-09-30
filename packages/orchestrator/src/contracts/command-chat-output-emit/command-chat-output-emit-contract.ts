/**
 * PURPOSE: Defines the data `commandChatOutputEmitTransformer` returns
 *
 * USAGE:
 * commandChatOutputEmitContract.parse(value);
 * // Returns validated CommandChatOutputEmit
 */
import { z } from '#gateway/npm/zod';
import { orchestrationEventTypeContract } from '@dungeonmaster/shared/contracts';
import { chatOutputEmitPayloadContract } from '../chat-output-emit-payload/chat-output-emit-payload-contract';

export const commandChatOutputEmitContract = z
  .object({
    type: orchestrationEventTypeContract,
    processId: z.string().brand<'CommandChatOutputEmitProcessId'>(),
    payload: chatOutputEmitPayloadContract,
  })
  .brand<'CommandChatOutputEmit'>();

export type CommandChatOutputEmit = z.infer<typeof commandChatOutputEmitContract>;
