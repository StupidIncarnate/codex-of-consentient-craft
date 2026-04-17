import {
  AssistantTextChatEntryStub,
  AssistantThinkingChatEntryStub,
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
  SystemErrorChatEntryStub,
  TaskNotificationChatEntryStub,
  UserChatEntryStub,
} from '@dungeonmaster/shared/contracts';
import { devLogChatEntrySummaryTransformer } from './dev-log-chat-entry-summary-transformer';

describe('devLogChatEntrySummaryTransformer', () => {
  it('VALID: {user entry} => returns user/text label', () => {
    const entry = UserChatEntryStub();

    const result = devLogChatEntrySummaryTransformer({ entry });

    expect(result).toBe('user/text  "Hello world"');
  });

  it('VALID: {assistant text entry} => returns assistant/text label', () => {
    const entry = AssistantTextChatEntryStub();

    const result = devLogChatEntrySummaryTransformer({ entry });

    expect(result).toBe('assistant/text  "Hello from assistant"');
  });

  it('VALID: {assistant tool_use entry} => returns assistant/tool_use label with tool name', () => {
    const entry = AssistantToolUseChatEntryStub();

    const result = devLogChatEntrySummaryTransformer({ entry });

    expect(result).toBe('assistant/tool_use  read_file');
  });

  it('VALID: {assistant thinking entry} => returns assistant/thinking label', () => {
    const entry = AssistantThinkingChatEntryStub();

    const result = devLogChatEntrySummaryTransformer({ entry });

    expect(result).toBe('assistant/thinking');
  });

  it('VALID: {assistant tool_result entry} => returns user/tool_result label with short ID', () => {
    const entry = AssistantToolResultChatEntryStub();

    const result = devLogChatEntrySummaryTransformer({ entry });

    expect(result).toBe('user/tool_result  read_fil  ok');
  });

  it('VALID: {system task_notification entry} => returns system/task_notification label', () => {
    const entry = TaskNotificationChatEntryStub();

    const result = devLogChatEntrySummaryTransformer({ entry });

    expect(result).toBe('system/task_notification  completed');
  });

  it('VALID: {system error entry} => returns system/error label', () => {
    const entry = SystemErrorChatEntryStub();

    const result = devLogChatEntrySummaryTransformer({ entry });

    expect(result).toBe('system/error');
  });
});
