import type { StubArgument } from '@dungeonmaster/shared/@types';

import { chatEntryContract } from './chat-entry-contract';
import type { ChatEntry } from './chat-entry-contract';

export const UserChatEntryStub = ({ ...props }: StubArgument<ChatEntry> = {}): ChatEntry =>
  chatEntryContract.parse({
    role: 'user',
    content: 'Hello world',
    ...props,
  });

export const AssistantTextChatEntryStub = ({ ...props }: StubArgument<ChatEntry> = {}): ChatEntry =>
  chatEntryContract.parse({
    role: 'assistant',
    type: 'text',
    content: 'Hello from assistant',
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
    ...props,
  });

export const AssistantThinkingChatEntryStub = ({
  ...props
}: StubArgument<ChatEntry> = {}): ChatEntry =>
  chatEntryContract.parse({
    role: 'assistant',
    type: 'thinking',
    content: 'This is internal thinking',
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
    ...props,
  });

export const SystemErrorChatEntryStub = ({ ...props }: StubArgument<ChatEntry> = {}): ChatEntry =>
  chatEntryContract.parse({
    role: 'system',
    type: 'error',
    content: 'Something went wrong',
    ...props,
  });

export const TaskToolUseChatEntryStub = ({ ...props }: StubArgument<ChatEntry> = {}): ChatEntry =>
  chatEntryContract.parse({
    role: 'assistant',
    type: 'tool_use',
    toolName: 'Task',
    toolInput: JSON.stringify({ description: 'Run tests', prompt: 'Execute the test suite' }),
    ...props,
  });

export const ChatEntryStub = ({ ...props }: StubArgument<ChatEntry> = {}): ChatEntry =>
  chatEntryContract.parse({
    role: 'user',
    content: 'Hello world',
    ...props,
  });
