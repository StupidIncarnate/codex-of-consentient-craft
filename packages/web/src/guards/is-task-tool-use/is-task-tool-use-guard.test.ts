import {
  AssistantToolUseChatEntryStub,
  TaskToolUseChatEntryStub,
  UserChatEntryStub,
} from '../../contracts/chat-entry/chat-entry.stub';
import { isTaskToolUseGuard } from './is-task-tool-use-guard';

describe('isTaskToolUseGuard', () => {
  describe('valid task tool use', () => {
    it('VALID: {Task tool_use with agentId} => returns true', () => {
      const entry = TaskToolUseChatEntryStub({ agentId: 'agent-001' });

      const result = isTaskToolUseGuard({ entry });

      expect(result).toBe(true);
    });
  });

  describe('non-task entries', () => {
    it('VALID: {user entry} => returns false', () => {
      const entry = UserChatEntryStub();

      const result = isTaskToolUseGuard({ entry });

      expect(result).toBe(false);
    });

    it('VALID: {tool_use without Task toolName} => returns false', () => {
      const entry = AssistantToolUseChatEntryStub({ toolName: 'read_file' });

      const result = isTaskToolUseGuard({ entry });

      expect(result).toBe(false);
    });

    it('VALID: {Task tool_use without agentId} => returns false', () => {
      const entry = TaskToolUseChatEntryStub();

      const result = isTaskToolUseGuard({ entry });

      expect(result).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {entry: undefined} => returns false', () => {
      const result = isTaskToolUseGuard({});

      expect(result).toBe(false);
    });
  });
});
