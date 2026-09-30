/**
 * PURPOSE: Builds a valid CommandChatOutputEmit for tests
 *
 * USAGE:
 * CommandChatOutputEmitStub();
 * // Returns a valid CommandChatOutputEmit
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';
import { OrchestrationEventTypeStub } from '@dungeonmaster/shared/contracts/orchestration-event-type/orchestration-event-type.stub';
import { ChatOutputEmitPayloadStub } from '../chat-output-emit-payload/chat-output-emit-payload.stub';

import { commandChatOutputEmitContract } from './command-chat-output-emit-contract';
import type { CommandChatOutputEmit } from './command-chat-output-emit-contract';

export const CommandChatOutputEmitStub = ({
  ...props
}: StubArgument<CommandChatOutputEmit> = {}): CommandChatOutputEmit =>
  commandChatOutputEmitContract.parse({
    type: OrchestrationEventTypeStub(),
    processId: 'sample',
    payload: ChatOutputEmitPayloadStub(),
    ...props,
  });
