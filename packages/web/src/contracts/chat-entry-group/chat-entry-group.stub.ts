import type { StubArgument } from '@dungeonmaster/shared/@types';

import {
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
  UserChatEntryStub,
} from '../chat-entry/chat-entry.stub';
import { chatEntryGroupContract } from './chat-entry-group-contract';
import type { ChatEntryGroup } from './chat-entry-group-contract';

export const SingleGroupStub = ({ ...props }: StubArgument<ChatEntryGroup> = {}): ChatEntryGroup =>
  chatEntryGroupContract.parse({
    kind: 'single',
    entry: UserChatEntryStub(),
    ...props,
  });

export const ToolGroupStub = ({ ...props }: StubArgument<ChatEntryGroup> = {}): ChatEntryGroup =>
  chatEntryGroupContract.parse({
    kind: 'tool-group',
    entries: [AssistantToolUseChatEntryStub(), AssistantToolResultChatEntryStub()],
    toolCount: 1,
    contextTokens: null,
    source: 'session',
    ...props,
  });
