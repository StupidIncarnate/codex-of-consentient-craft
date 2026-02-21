import type { StubArgument } from '@dungeonmaster/shared/@types';

import {
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
  TaskToolUseChatEntryStub,
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

export const SubagentChainGroupStub = ({
  ...props
}: StubArgument<ChatEntryGroup> = {}): ChatEntryGroup =>
  chatEntryGroupContract.parse({
    kind: 'subagent-chain',
    agentId: 'agent-001',
    description: 'Run tests',
    taskToolUse: TaskToolUseChatEntryStub({ agentId: 'agent-001' }),
    innerGroups: [
      {
        kind: 'tool-group',
        entries: [
          AssistantToolUseChatEntryStub({ source: 'subagent', agentId: 'agent-001' }),
          AssistantToolResultChatEntryStub({ source: 'subagent', agentId: 'agent-001' }),
        ],
        toolCount: 1,
        contextTokens: null,
        source: 'subagent',
      },
    ],
    taskNotification: null,
    entryCount: 2,
    ...props,
  });
