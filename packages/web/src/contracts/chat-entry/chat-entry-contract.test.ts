import { chatEntryContract } from './chat-entry-contract';
import {
  AssistantTextChatEntryStub,
  AssistantThinkingChatEntryStub,
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
  ChatEntryStub,
  SystemErrorChatEntryStub,
  TaskToolUseChatEntryStub,
} from './chat-entry.stub';

describe('chatEntryContract', () => {
  describe('user entries', () => {
    it('VALID: {role: "user", content: "Hello world"} => parses successfully', () => {
      const entry = ChatEntryStub();

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'user',
        content: 'Hello world',
      });
    });

    it('VALID: {role: "user", content override} => parses with custom content', () => {
      const entry = ChatEntryStub({ content: 'Custom message' as never });

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'user',
        content: 'Custom message',
      });
    });
  });

  describe('assistant text entries', () => {
    it('VALID: {role: "assistant", type: "text"} => parses successfully', () => {
      const entry = AssistantTextChatEntryStub();

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'text',
        content: 'Hello from assistant',
      });
    });

    it('VALID: {role: "assistant", type: "text", usage} => parses with usage', () => {
      const entry = AssistantTextChatEntryStub({
        usage: {
          inputTokens: 100,
          outputTokens: 50,
          cacheCreationInputTokens: 10,
          cacheReadInputTokens: 5,
        },
      } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'text',
        content: 'Hello from assistant',
        usage: {
          inputTokens: 100,
          outputTokens: 50,
          cacheCreationInputTokens: 10,
          cacheReadInputTokens: 5,
        },
      });
    });
  });

  describe('assistant tool_use entries', () => {
    it('VALID: {role: "assistant", type: "tool_use"} => parses successfully', () => {
      const entry = AssistantToolUseChatEntryStub();

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_use',
        toolName: 'read_file',
        toolInput: '{"path":"/test"}',
      });
    });
  });

  describe('assistant tool_result entries', () => {
    it('VALID: {role: "assistant", type: "tool_result"} => parses successfully', () => {
      const entry = AssistantToolResultChatEntryStub();

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_result',
        toolName: 'read_file',
        content: 'file contents here',
      });
    });
  });

  describe('system error entries', () => {
    it('VALID: {role: "system", type: "error"} => parses successfully', () => {
      const entry = SystemErrorChatEntryStub();

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'system',
        type: 'error',
        content: 'Something went wrong',
      });
    });
  });

  describe('agentId field', () => {
    it('VALID: {role: "user", agentId: "abc123"} => parses with agentId', () => {
      const entry = ChatEntryStub({ agentId: 'abc123' } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'user',
        content: 'Hello world',
        agentId: 'abc123',
      });
    });

    it('VALID: {role: "assistant", type: "tool_use", agentId} => parses with agentId', () => {
      const entry = AssistantToolUseChatEntryStub({ agentId: 'agent-42' } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_use',
        toolName: 'read_file',
        toolInput: '{"path":"/test"}',
        agentId: 'agent-42',
      });
    });

    it('VALID: {role: "user", no agentId} => parses without agentId (optional)', () => {
      const entry = ChatEntryStub();

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'user',
        content: 'Hello world',
      });
    });
  });

  describe('TaskToolUseChatEntryStub', () => {
    it('VALID: TaskToolUseChatEntryStub => creates tool_use with Task toolName', () => {
      const entry = TaskToolUseChatEntryStub();

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_use',
        toolName: 'Task',
        toolInput: JSON.stringify({ description: 'Run tests', prompt: 'Execute the test suite' }),
      });
    });

    it('VALID: TaskToolUseChatEntryStub with agentId => includes agentId', () => {
      const entry = TaskToolUseChatEntryStub({ agentId: 'sub-1' } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_use',
        toolName: 'Task',
        toolInput: JSON.stringify({ description: 'Run tests', prompt: 'Execute the test suite' }),
        agentId: 'sub-1',
      });
    });
  });

  describe('assistant thinking entries', () => {
    it('VALID: {role: "assistant", type: "thinking"} => parses successfully', () => {
      const entry = AssistantThinkingChatEntryStub();

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'thinking',
        content: 'This is internal thinking',
      });
    });

    it('VALID: {role: "assistant", type: "thinking", agentId} => parses with agentId', () => {
      const entry = AssistantThinkingChatEntryStub({ agentId: 'agent-99' } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'thinking',
        content: 'This is internal thinking',
        agentId: 'agent-99',
      });
    });
  });

  describe('model field', () => {
    it('VALID: {assistant text entry with model} => parses with model', () => {
      const entry = AssistantTextChatEntryStub({ model: 'claude-opus-4-6' } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'text',
        content: 'Hello from assistant',
        model: 'claude-opus-4-6',
      });
    });

    it('VALID: {assistant tool_use entry with model} => parses with model', () => {
      const entry = AssistantToolUseChatEntryStub({ model: 'claude-sonnet-4' } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_use',
        toolName: 'read_file',
        toolInput: '{"path":"/test"}',
        model: 'claude-sonnet-4',
      });
    });

    it('VALID: {assistant thinking entry with model} => parses with model', () => {
      const entry = AssistantThinkingChatEntryStub({ model: 'claude-opus-4-6' } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'thinking',
        content: 'This is internal thinking',
        model: 'claude-opus-4-6',
      });
    });

    it('VALID: {assistant text entry without model} => model is optional', () => {
      const entry = AssistantTextChatEntryStub();

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'text',
        content: 'Hello from assistant',
      });
    });
  });

  describe('isInjectedPrompt field', () => {
    it('VALID: {user entry with isInjectedPrompt: true} => parses with isInjectedPrompt', () => {
      const entry = ChatEntryStub({ isInjectedPrompt: true } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'user',
        content: 'Hello world',
        isInjectedPrompt: true,
      });
    });

    it('VALID: {user entry without isInjectedPrompt} => isInjectedPrompt is optional', () => {
      const entry = ChatEntryStub();

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'user',
        content: 'Hello world',
      });
    });
  });

  describe('invalid entries', () => {
    it('INVALID_ROLE: {role: "system", missing type} => throws validation error', () => {
      expect(() => {
        chatEntryContract.parse({ role: 'system', content: 'test' });
      }).toThrow(/Invalid input/u);
    });

    it('INVALID_CONTENT: {role: "user", content: ""} => throws validation error', () => {
      expect(() => {
        chatEntryContract.parse({ role: 'user', content: '' });
      }).toThrow(/too_small/u);
    });

    it('INVALID_TYPE: {role: "assistant", type: "unknown"} => throws validation error', () => {
      expect(() => {
        chatEntryContract.parse({
          role: 'assistant',
          type: 'unknown',
          content: 'test',
        });
      }).toThrow(/Invalid input/u);
    });

    it('INVALID_MULTIPLE: {missing all fields} => throws validation error', () => {
      expect(() => {
        chatEntryContract.parse({});
      }).toThrow(/Invalid input/u);
    });
  });
});
