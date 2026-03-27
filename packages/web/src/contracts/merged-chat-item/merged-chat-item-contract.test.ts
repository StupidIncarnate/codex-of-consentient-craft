import { mergedChatItemContract } from './merged-chat-item-contract';
import { MergedEntryItemStub, MergedToolPairItemStub } from './merged-chat-item.stub';

describe('mergedChatItemContract', () => {
  describe('valid items', () => {
    it('VALID: {kind: entry} => parses regular entry item', () => {
      const result = MergedEntryItemStub();

      expect(result.kind).toBe('entry');
    });

    it('VALID: {kind: tool-pair} => parses tool pair item', () => {
      const result = MergedToolPairItemStub();

      expect(result.kind).toBe('tool-pair');
    });
  });

  describe('invalid items', () => {
    it('INVALID_MULTIPLE: {kind: unknown} => throws validation error', () => {
      expect(() => mergedChatItemContract.parse({ kind: 'unknown', entry: {} })).toThrow(
        /Invalid discriminator/u,
      );
    });
  });
});
