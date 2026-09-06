import {
  AssistantTextChatEntryStub,
  AssistantToolUseChatEntryStub,
  SystemErrorChatEntryStub,
  UserChatEntryStub,
} from '@dungeonmaster/shared/contracts';
import { pastedImageStatics } from '@dungeonmaster/shared/statics';

import { hasEquivalentChatEntryGuard } from './has-equivalent-chat-entry-guard';

describe('hasEquivalentChatEntryGuard', () => {
  describe('matching entry', () => {
    it('VALID: {entry: user "hi", among contains user "hi"} => returns true', () => {
      const entry = UserChatEntryStub({ content: 'hi' });
      const among = [UserChatEntryStub({ content: 'hi' })];

      expect(hasEquivalentChatEntryGuard({ entry, among })).toBe(true);
    });

    it('VALID: {entry: assistant text "ok", among contains assistant text "ok"} => returns true', () => {
      const entry = AssistantTextChatEntryStub({ content: 'ok' });
      const among = [AssistantTextChatEntryStub({ content: 'ok' })];

      expect(hasEquivalentChatEntryGuard({ entry, among })).toBe(true);
    });
  });

  describe('non-matching entry', () => {
    it('VALID: {entry: user "hi", among contains user "bye"} => returns false', () => {
      const entry = UserChatEntryStub({ content: 'hi' });
      const among = [UserChatEntryStub({ content: 'bye' })];

      expect(hasEquivalentChatEntryGuard({ entry, among })).toBe(false);
    });

    it('VALID: {entry: user "hi", among contains assistant text "hi"} => returns false', () => {
      const entry = UserChatEntryStub({ content: 'hi' });
      const among = [AssistantTextChatEntryStub({ content: 'hi' })];

      expect(hasEquivalentChatEntryGuard({ entry, among })).toBe(false);
    });

    it('VALID: {entry: tool_use, among contains tool_use with same toolName} => returns false (no content field)', () => {
      const entry = AssistantToolUseChatEntryStub();
      const among = [AssistantToolUseChatEntryStub()];

      expect(hasEquivalentChatEntryGuard({ entry, among })).toBe(false);
    });

    it('VALID: {entry: user "hi", among contains user "hi" later} => returns true (multi-element among)', () => {
      const entry = UserChatEntryStub({ content: 'hi' });
      const among = [
        AssistantTextChatEntryStub({ content: 'first' }),
        UserChatEntryStub({ content: 'hi' }),
      ];

      expect(hasEquivalentChatEntryGuard({ entry, among })).toBe(true);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {entry: undefined} => returns false', () => {
      expect(hasEquivalentChatEntryGuard({ among: [UserChatEntryStub()] })).toBe(false);
    });

    it('EMPTY: {among: undefined} => returns false', () => {
      expect(hasEquivalentChatEntryGuard({ entry: UserChatEntryStub() })).toBe(false);
    });

    it('EMPTY: {among: []} => returns false', () => {
      expect(hasEquivalentChatEntryGuard({ entry: UserChatEntryStub(), among: [] })).toBe(false);
    });

    it('EMPTY: {entry: error system, among contains user with same content} => returns false (role mismatch)', () => {
      const entry = SystemErrorChatEntryStub({ content: 'shared' });
      const among = [UserChatEntryStub({ content: 'shared' })];

      expect(hasEquivalentChatEntryGuard({ entry, among })).toBe(false);
    });
  });

  describe('pasted-image content parity', () => {
    it('VALID: {entry: user optimistic pasted-image text, among contains user transcript text with a resolved image URL} => returns true', () => {
      const entry = UserChatEntryStub({ content: 'A[Pasted Image 1]B' });
      const among = [
        UserChatEntryStub({
          content: 'A![Pasted Image 1](http://host/api/images?path=%2Fp%2Fx.png)B',
        }),
      ];

      expect(hasEquivalentChatEntryGuard({ entry, among })).toBe(true);
    });

    it('VALID: {entry: user optimistic pasted-image text, among contains user with a different message} => returns false', () => {
      const entry = UserChatEntryStub({ content: 'A[Pasted Image 1]B' });
      const among = [UserChatEntryStub({ content: 'a completely different message' })];

      expect(hasEquivalentChatEntryGuard({ entry, among })).toBe(false);
    });

    it('VALID: {entry: user transcript text carrying the images trailer, among contains user with the same text minus the trailer} => returns true', () => {
      const baseMessage = 'A![Pasted Image 1](http://host/api/images?path=%2Fp%2Fx.png)B';
      const withTrailer = `${baseMessage}\n\n${pastedImageStatics.promptSentinel}\n${pastedImageStatics.promptInstruction}`;
      const entry = UserChatEntryStub({ content: withTrailer });
      const among = [UserChatEntryStub({ content: baseMessage })];

      expect(hasEquivalentChatEntryGuard({ entry, among })).toBe(true);
    });

    it('VALID: {entry: user "A[Pasted Image 1]B", among contains user "A[Pasted Image 2]B"} => returns false (ordinal differs)', () => {
      const entry = UserChatEntryStub({ content: 'A[Pasted Image 1]B' });
      const among = [UserChatEntryStub({ content: 'A[Pasted Image 2]B' })];

      expect(hasEquivalentChatEntryGuard({ entry, among })).toBe(false);
    });
  });
});
