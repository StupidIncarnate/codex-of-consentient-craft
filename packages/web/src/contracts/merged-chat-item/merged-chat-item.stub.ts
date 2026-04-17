import type { StubArgument } from '@dungeonmaster/shared/@types';

import {
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
  UserChatEntryStub,
} from '@dungeonmaster/shared/contracts';
import { mergedChatItemContract } from './merged-chat-item-contract';
import type { MergedChatItem } from './merged-chat-item-contract';

export const MergedEntryItemStub = ({
  ...props
}: StubArgument<MergedChatItem> = {}): MergedChatItem =>
  mergedChatItemContract.parse({
    kind: 'entry',
    entry: UserChatEntryStub(),
    ...props,
  });

export const MergedToolPairItemStub = ({
  ...props
}: StubArgument<MergedChatItem> = {}): MergedChatItem =>
  mergedChatItemContract.parse({
    kind: 'tool-pair',
    toolUse: AssistantToolUseChatEntryStub({ toolUseId: 'use_1' }),
    toolResult: AssistantToolResultChatEntryStub({ toolName: 'use_1' }),
    ...props,
  });
