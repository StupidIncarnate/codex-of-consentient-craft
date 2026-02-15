import {
  AssistantTextChatEntryStub,
  AssistantToolUseChatEntryStub,
  UserChatEntryStub,
} from '../../contracts/chat-entry/chat-entry.stub';
import { raccoonAnimationConfigStatics } from '../../statics/raccoon-animation-config/raccoon-animation-config-statics';
import { raccoonAnimationIntervalTransformer } from './raccoon-animation-interval-transformer';

describe('raccoonAnimationIntervalTransformer', () => {
  describe('idle state', () => {
    it('VALID: {isStreaming: false, empty entries} => returns idle interval', () => {
      const result = raccoonAnimationIntervalTransformer({ isStreaming: false, entries: [] });

      expect(result).toBe(raccoonAnimationConfigStatics.idleIntervalMs);
    });

    it('VALID: {isStreaming: false, with entries} => returns idle interval', () => {
      const entries = [UserChatEntryStub({ content: 'Hello' })];

      const result = raccoonAnimationIntervalTransformer({ isStreaming: false, entries });

      expect(result).toBe(raccoonAnimationConfigStatics.idleIntervalMs);
    });
  });

  describe('thinking state', () => {
    it('VALID: {isStreaming: true, last entry is user} => returns thinking interval', () => {
      const entries = [UserChatEntryStub({ content: 'Build auth' })];

      const result = raccoonAnimationIntervalTransformer({ isStreaming: true, entries });

      expect(result).toBe(raccoonAnimationConfigStatics.thinkingIntervalMs);
    });

    it('VALID: {isStreaming: true, last entry is assistant text} => returns thinking interval', () => {
      const entries = [
        UserChatEntryStub({ content: 'Hello' }),
        AssistantTextChatEntryStub({ content: 'Hi there' }),
      ];

      const result = raccoonAnimationIntervalTransformer({ isStreaming: true, entries });

      expect(result).toBe(raccoonAnimationConfigStatics.thinkingIntervalMs);
    });
  });

  describe('tool call state', () => {
    it('VALID: {isStreaming: true, last entry is tool_use} => returns tool call interval', () => {
      const entries = [
        UserChatEntryStub({ content: 'Do something' }),
        AssistantToolUseChatEntryStub({ toolName: 'read_file', toolInput: '{}' }),
      ];

      const result = raccoonAnimationIntervalTransformer({ isStreaming: true, entries });

      expect(result).toBe(raccoonAnimationConfigStatics.toolCallIntervalMs);
    });
  });

  describe('empty streaming state', () => {
    it('VALID: {isStreaming: true, empty entries} => returns idle interval', () => {
      const result = raccoonAnimationIntervalTransformer({ isStreaming: true, entries: [] });

      expect(result).toBe(raccoonAnimationConfigStatics.idleIntervalMs);
    });
  });
});
