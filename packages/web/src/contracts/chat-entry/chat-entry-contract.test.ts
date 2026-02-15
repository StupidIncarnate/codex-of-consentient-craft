import { chatEntryContract } from './chat-entry-contract';
import {
  AssistantTextChatEntryStub,
  AssistantToolResultChatEntryStub,
  AssistantToolUseChatEntryStub,
  ChatEntryStub,
  SystemErrorChatEntryStub,
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
