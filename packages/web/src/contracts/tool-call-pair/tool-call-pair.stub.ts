import type { StubArgument } from '@dungeonmaster/shared/@types';

import {
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
} from '@dungeonmaster/shared/contracts';
import { toolCallPairContract } from './tool-call-pair-contract';
import type { ToolCallPair } from './tool-call-pair-contract';

export const ToolCallPairStub = ({ ...props }: StubArgument<ToolCallPair> = {}): ToolCallPair =>
  toolCallPairContract.parse({
    toolUse: AssistantToolUseChatEntryStub(),
    toolResult: AssistantToolResultChatEntryStub(),
    ...props,
  });

export const ToolCallPairNoResultStub = ({
  ...props
}: StubArgument<ToolCallPair> = {}): ToolCallPair =>
  toolCallPairContract.parse({
    toolUse: AssistantToolUseChatEntryStub(),
    toolResult: null,
    ...props,
  });

export const OrphanToolResultStub = ({ ...props }: StubArgument<ToolCallPair> = {}): ToolCallPair =>
  toolCallPairContract.parse({
    toolUse: null,
    toolResult: AssistantToolResultChatEntryStub(),
    ...props,
  });
