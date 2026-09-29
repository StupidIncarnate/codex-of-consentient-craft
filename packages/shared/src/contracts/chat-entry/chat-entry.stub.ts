import type { StubArgument } from '../../@types/stub-argument.type';

import { chatEntryContract } from './chat-entry-contract';
import type { ChatEntry } from './chat-entry-contract';

const stubTimestamp = (): string => new Date().toISOString();

export const UserChatEntryStub = ({ ...props }: StubArgument<ChatEntry> = {}): ChatEntry =>
  chatEntryContract.parse({
    role: 'user',
    content: 'Hello world',
    uuid: 'a1b2c3d4-0001-4000-8000-000000000001',
    timestamp: stubTimestamp(),
    ...props,
  });

export const AssistantTextChatEntryStub = ({ ...props }: StubArgument<ChatEntry> = {}): ChatEntry =>
  chatEntryContract.parse({
    role: 'assistant',
    type: 'text',
    content: 'Hello from assistant',
    uuid: 'a1b2c3d4-0002-4000-8000-000000000002',
    timestamp: stubTimestamp(),
    ...props,
  });

export const AssistantToolUseChatEntryStub = ({
  ...props
}: StubArgument<ChatEntry> = {}): ChatEntry =>
  chatEntryContract.parse({
    role: 'assistant',
    type: 'tool_use',
    toolName: 'read_file',
    toolInput: '{"path":"/test"}',
    uuid: 'a1b2c3d4-0003-4000-8000-000000000003',
    timestamp: stubTimestamp(),
    ...props,
  });

export const AssistantThinkingChatEntryStub = ({
  ...props
}: StubArgument<ChatEntry> = {}): ChatEntry =>
  chatEntryContract.parse({
    role: 'assistant',
    type: 'thinking',
    content: 'This is internal thinking',
    uuid: 'a1b2c3d4-0004-4000-8000-000000000004',
    timestamp: stubTimestamp(),
    ...props,
  });

export const AssistantToolResultChatEntryStub = ({
  ...props
}: StubArgument<ChatEntry> = {}): ChatEntry =>
  chatEntryContract.parse({
    role: 'assistant',
    type: 'tool_result',
    toolName: 'read_file',
    content: 'file contents here',
    uuid: 'a1b2c3d4-0005-4000-8000-000000000005',
    timestamp: stubTimestamp(),
    ...props,
  });

export const TaskNotificationChatEntryStub = ({
  ...props
}: StubArgument<ChatEntry> = {}): ChatEntry =>
  chatEntryContract.parse({
    role: 'system',
    type: 'task_notification',
    taskId: 'task-001',
    status: 'completed',
    summary: 'Agent completed the task',
    uuid: 'a1b2c3d4-0006-4000-8000-000000000006',
    timestamp: stubTimestamp(),
    ...props,
  });

export const SystemErrorChatEntryStub = ({ ...props }: StubArgument<ChatEntry> = {}): ChatEntry =>
  chatEntryContract.parse({
    role: 'system',
    type: 'error',
    content: 'Something went wrong',
    uuid: 'a1b2c3d4-0007-4000-8000-000000000007',
    timestamp: stubTimestamp(),
    ...props,
  });

export const TaskToolUseChatEntryStub = ({ ...props }: StubArgument<ChatEntry> = {}): ChatEntry =>
  chatEntryContract.parse({
    role: 'assistant',
    type: 'tool_use',
    toolName: 'Task',
    toolInput: JSON.stringify({ description: 'Run tests', prompt: 'Execute the test suite' }),
    uuid: 'a1b2c3d4-0008-4000-8000-000000000008',
    timestamp: stubTimestamp(),
    ...props,
  });

export const ChatEntryStub = ({ ...props }: StubArgument<ChatEntry> = {}): ChatEntry =>
  chatEntryContract.parse({
    role: 'user',
    content: 'Hello world',
    uuid: 'a1b2c3d4-0009-4000-8000-000000000009',
    timestamp: stubTimestamp(),
    ...props,
  });
