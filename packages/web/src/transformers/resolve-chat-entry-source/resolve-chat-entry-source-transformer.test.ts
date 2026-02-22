import {
  AssistantTextChatEntryStub,
  UserChatEntryStub,
} from '../../contracts/chat-entry/chat-entry.stub';
import { resolveChatEntrySourceTransformer } from './resolve-chat-entry-source-transformer';

describe('resolveChatEntrySourceTransformer', () => {
  describe('session source', () => {
    it('VALID: {entry with no source} => returns session', () => {
      const result = resolveChatEntrySourceTransformer({ entry: UserChatEntryStub() });

      expect(result).toBe('session');
    });

    it('VALID: {entry with source: session} => returns session', () => {
      const result = resolveChatEntrySourceTransformer({
        entry: AssistantTextChatEntryStub({ source: 'session' }),
      });

      expect(result).toBe('session');
    });
  });

  describe('subagent source', () => {
    it('VALID: {entry with source: subagent} => returns subagent', () => {
      const result = resolveChatEntrySourceTransformer({
        entry: AssistantTextChatEntryStub({ source: 'subagent' }),
      });

      expect(result).toBe('subagent');
    });
  });
});
