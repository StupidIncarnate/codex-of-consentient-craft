import { UserChatEntryStub } from '../../contracts/chat-entry/chat-entry.stub';
import { flushNormalBufferTransformer } from './flush-normal-buffer-transformer';

describe('flushNormalBufferTransformer', () => {
  describe('empty buffer', () => {
    it('EMPTY: {buffer: []} => returns empty array', () => {
      const result = flushNormalBufferTransformer({ buffer: [] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('non-empty buffer', () => {
    it('VALID: {buffer: [userEntry]} => delegates to groupChatEntriesTransformer', () => {
      const entry = UserChatEntryStub();

      const result = flushNormalBufferTransformer({ buffer: [entry] });

      expect(result).toStrictEqual([{ kind: 'single', entry }]);
    });
  });
});
