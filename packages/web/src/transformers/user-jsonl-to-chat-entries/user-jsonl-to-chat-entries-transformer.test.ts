import {
  UserTextArrayStreamLineStub,
  UserTextStringStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import { userJsonlToChatEntriesTransformer } from './user-jsonl-to-chat-entries-transformer';

describe('userJsonlToChatEntriesTransformer', () => {
  describe('string content', () => {
    it('VALID: {string content "hello"} => returns user chat entry', () => {
      const stub = UserTextStringStreamLineStub({ message: { role: 'user', content: 'hello' } });

      const result = userJsonlToChatEntriesTransformer({
        entry: stub,
        validSource: undefined,
        validAgentId: undefined,
      });

      expect(result).toStrictEqual([{ role: 'user', content: 'hello' }]);
    });

    it('VALID: {content with "## User Request"} => sets isInjectedPrompt true', () => {
      const stub = UserTextStringStreamLineStub({
        message: {
          role: 'user',
          content: 'Some system prompt\n\n## User Request\n\nDo something',
        },
      });

      const result = userJsonlToChatEntriesTransformer({
        entry: stub,
        validSource: undefined,
        validAgentId: undefined,
      });

      expect(result).toStrictEqual([
        {
          role: 'user',
          content: 'Some system prompt\n\n## User Request\n\nDo something',
          isInjectedPrompt: true,
        },
      ]);
    });

    it('EDGE: {empty string content} => returns empty array', () => {
      const result = userJsonlToChatEntriesTransformer({
        entry: { message: { role: 'user', content: '' } },
        validSource: undefined,
        validAgentId: undefined,
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('array content', () => {
    it('VALID: {array content with text items} => returns joined text', () => {
      const stub = UserTextArrayStreamLineStub({
        message: {
          role: 'user',
          content: [
            { type: 'text', text: 'hello ' },
            { type: 'text', text: 'world' },
          ],
        },
      });

      const result = userJsonlToChatEntriesTransformer({
        entry: stub,
        validSource: undefined,
        validAgentId: undefined,
      });

      expect(result).toStrictEqual([{ role: 'user', content: 'hello world' }]);
    });
  });

  describe('source and agentId propagation', () => {
    it('VALID: {validSource "session"} => propagates source', () => {
      const stub = UserTextStringStreamLineStub({ message: { role: 'user', content: 'hello' } });

      const result = userJsonlToChatEntriesTransformer({
        entry: stub,
        validSource: 'session',
        validAgentId: undefined,
      });

      expect(result).toStrictEqual([{ role: 'user', content: 'hello', source: 'session' }]);
    });

    it('VALID: {validAgentId "agent-1"} => propagates agentId', () => {
      const stub = UserTextStringStreamLineStub({ message: { role: 'user', content: 'hello' } });

      const result = userJsonlToChatEntriesTransformer({
        entry: stub,
        validSource: undefined,
        validAgentId: 'agent-1',
      });

      expect(result).toStrictEqual([{ role: 'user', content: 'hello', agentId: 'agent-1' }]);
    });
  });

  describe('missing message', () => {
    it('EDGE: {no message field} => returns empty array', () => {
      const result = userJsonlToChatEntriesTransformer({
        entry: { type: 'user' },
        validSource: undefined,
        validAgentId: undefined,
      });

      expect(result).toStrictEqual([]);
    });
  });
});
