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

const FIXED_UUID = '11111111-1111-4111-8111-111111111111';
const FIXED_TS = '2026-05-04T20:12:38.738Z';

describe('chatEntryContract', () => {
  describe('user entries', () => {
    it('VALID: {role: "user", content: "Hello world"} => parses successfully', () => {
      const entry = ChatEntryStub({ uuid: FIXED_UUID, timestamp: FIXED_TS } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'user',
        content: 'Hello world',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      });
    });

    it('VALID: {role: "user", content override} => parses with custom content', () => {
      const entry = ChatEntryStub({
        content: 'Custom message',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'user',
        content: 'Custom message',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      });
    });
  });

  describe('assistant text entries', () => {
    it('VALID: {role: "assistant", type: "text"} => parses successfully', () => {
      const entry = AssistantTextChatEntryStub({
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'text',
        content: 'Hello from assistant',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
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
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
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
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      });
    });
  });

  describe('assistant tool_use entries', () => {
    it('VALID: {role: "assistant", type: "tool_use"} => parses successfully', () => {
      const entry = AssistantToolUseChatEntryStub({
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_use',
        toolName: 'read_file',
        toolInput: '{"path":"/test"}',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      });
    });

    it('VALID: {role: "assistant", type: "tool_use", toolUseId} => parses with toolUseId', () => {
      const entry = AssistantToolUseChatEntryStub({
        toolUseId: 'toolu_abc123',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_use',
        toolUseId: 'toolu_abc123',
        toolName: 'read_file',
        toolInput: '{"path":"/test"}',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      });
    });

    it('VALID: {role: "assistant", type: "tool_use", no toolUseId} => toolUseId is optional', () => {
      const entry = AssistantToolUseChatEntryStub({
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_use',
        toolName: 'read_file',
        toolInput: '{"path":"/test"}',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      });
    });
  });

  describe('assistant tool_result entries', () => {
    it('VALID: {role: "assistant", type: "tool_result"} => parses successfully', () => {
      const entry = AssistantToolResultChatEntryStub({
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_result',
        toolName: 'read_file',
        content: 'file contents here',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      });
    });
  });

  describe('system error entries', () => {
    it('VALID: {role: "system", type: "error"} => parses successfully', () => {
      const entry = SystemErrorChatEntryStub({ uuid: FIXED_UUID, timestamp: FIXED_TS } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'system',
        type: 'error',
        content: 'Something went wrong',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      });
    });
  });

  describe('agentId field', () => {
    it('VALID: {role: "user", agentId: "abc123"} => parses with agentId', () => {
      const entry = ChatEntryStub({
        agentId: 'abc123',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'user',
        content: 'Hello world',
        agentId: 'abc123',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      });
    });

    it('VALID: {role: "assistant", type: "tool_use", agentId} => parses with agentId', () => {
      const entry = AssistantToolUseChatEntryStub({
        agentId: 'agent-42',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_use',
        toolName: 'read_file',
        toolInput: '{"path":"/test"}',
        agentId: 'agent-42',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      });
    });

    it('VALID: {role: "user", no agentId} => parses without agentId (optional)', () => {
      const entry = ChatEntryStub({ uuid: FIXED_UUID, timestamp: FIXED_TS } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'user',
        content: 'Hello world',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      });
    });
  });

  describe('TaskToolUseChatEntryStub', () => {
    it('VALID: TaskToolUseChatEntryStub => creates tool_use with Task toolName', () => {
      const entry = TaskToolUseChatEntryStub({ uuid: FIXED_UUID, timestamp: FIXED_TS } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_use',
        toolName: 'Task',
        toolInput: JSON.stringify({ description: 'Run tests', prompt: 'Execute the test suite' }),
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      });
    });

    it('VALID: TaskToolUseChatEntryStub with agentId => includes agentId', () => {
      const entry = TaskToolUseChatEntryStub({
        agentId: 'sub-1',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_use',
        toolName: 'Task',
        toolInput: JSON.stringify({ description: 'Run tests', prompt: 'Execute the test suite' }),
        agentId: 'sub-1',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      });
    });
  });

  describe('assistant thinking entries', () => {
    it('VALID: {role: "assistant", type: "thinking"} => parses successfully', () => {
      const entry = AssistantThinkingChatEntryStub({
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'thinking',
        content: 'This is internal thinking',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      });
    });

    it('VALID: {role: "assistant", type: "thinking", agentId} => parses with agentId', () => {
      const entry = AssistantThinkingChatEntryStub({
        agentId: 'agent-99',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'thinking',
        content: 'This is internal thinking',
        agentId: 'agent-99',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      });
    });
  });

  describe('model field', () => {
    it('VALID: {assistant text entry with model} => parses with model', () => {
      const entry = AssistantTextChatEntryStub({
        model: 'claude-opus-4-6',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'text',
        content: 'Hello from assistant',
        model: 'claude-opus-4-6',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      });
    });

    it('VALID: {assistant tool_use entry with model} => parses with model', () => {
      const entry = AssistantToolUseChatEntryStub({
        model: 'claude-sonnet-4',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'tool_use',
        toolName: 'read_file',
        toolInput: '{"path":"/test"}',
        model: 'claude-sonnet-4',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      });
    });

    it('VALID: {assistant thinking entry with model} => parses with model', () => {
      const entry = AssistantThinkingChatEntryStub({
        model: 'claude-opus-4-6',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'thinking',
        content: 'This is internal thinking',
        model: 'claude-opus-4-6',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      });
    });

    it('VALID: {assistant text entry without model} => model is optional', () => {
      const entry = AssistantTextChatEntryStub({
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'assistant',
        type: 'text',
        content: 'Hello from assistant',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      });
    });
  });

  describe('isInjectedPrompt field', () => {
    it('VALID: {user entry with isInjectedPrompt: true} => parses with isInjectedPrompt', () => {
      const entry = ChatEntryStub({
        isInjectedPrompt: true,
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'user',
        content: 'Hello world',
        isInjectedPrompt: true,
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      });
    });

    it('VALID: {user entry without isInjectedPrompt} => isInjectedPrompt is optional', () => {
      const entry = ChatEntryStub({ uuid: FIXED_UUID, timestamp: FIXED_TS } as never);

      const result = chatEntryContract.parse(entry);

      expect(result).toStrictEqual({
        role: 'user',
        content: 'Hello world',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      });
    });
  });

  describe('uuid + timestamp fields', () => {
    it('VALID: {valid uuid + iso timestamp} => parses successfully', () => {
      const result = chatEntryContract.parse({
        role: 'user',
        content: 'Hello world',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      });

      expect(result).toStrictEqual({
        role: 'user',
        content: 'Hello world',
        uuid: FIXED_UUID,
        timestamp: FIXED_TS,
      });
    });

    it('INVALID: {missing uuid} => throws validation error', () => {
      expect(() => {
        chatEntryContract.parse({
          role: 'user',
          content: 'Hello world',
          timestamp: FIXED_TS,
        });
      }).toThrow(/Invalid input/u);
    });

    it('INVALID: {missing timestamp} => throws validation error', () => {
      expect(() => {
        chatEntryContract.parse({
          role: 'user',
          content: 'Hello world',
          uuid: FIXED_UUID,
        });
      }).toThrow(/Invalid input/u);
    });

    it('INVALID: {empty uuid value} => throws validation error', () => {
      expect(() => {
        chatEntryContract.parse({
          role: 'user',
          content: 'Hello world',
          uuid: '',
          timestamp: FIXED_TS,
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {non-iso timestamp value} => throws validation error', () => {
      expect(() => {
        chatEntryContract.parse({
          role: 'user',
          content: 'Hello world',
          uuid: FIXED_UUID,
          timestamp: 'yesterday',
        });
      }).toThrow(/Invalid datetime/u);
    });
  });

  describe('invalid entries', () => {
    it('INVALID: {role: "system", missing type} => throws validation error', () => {
      expect(() => {
        chatEntryContract.parse({
          role: 'system',
          content: 'test',
          uuid: FIXED_UUID,
          timestamp: FIXED_TS,
        });
      }).toThrow(/Invalid input/u);
    });

    it('INVALID: {role: "user", content: ""} => throws validation error', () => {
      expect(() => {
        chatEntryContract.parse({
          role: 'user',
          content: '',
          uuid: FIXED_UUID,
          timestamp: FIXED_TS,
        });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {role: "assistant", type: "unknown"} => throws validation error', () => {
      expect(() => {
        chatEntryContract.parse({
          role: 'assistant',
          type: 'unknown',
          content: 'test',
          uuid: FIXED_UUID,
          timestamp: FIXED_TS,
        });
      }).toThrow(/Invalid input/u);
    });

    it('INVALID: {missing all fields} => throws validation error', () => {
      expect(() => {
        chatEntryContract.parse({});
      }).toThrow(/Invalid input/u);
    });
  });
});
