import { isLegacyComposerScopeRecordGuard } from './is-legacy-composer-scope-record-guard';

describe('isLegacyComposerScopeRecordGuard', () => {
  describe('legacy record', () => {
    it('VALID: {record: {attachmentId, mediaType, dataBase64}} => returns true (no scopeKey field)', () => {
      const result = isLegacyComposerScopeRecordGuard({
        record: { attachmentId: 'a', mediaType: 'image/png', dataBase64: 'iVBORw0KGgo=' },
      });

      expect(result).toBe(true);
    });
  });

  describe('already-scoped record', () => {
    it('INVALID: {record: {..., scopeKey: "quest-a"}} => returns false', () => {
      const result = isLegacyComposerScopeRecordGuard({
        record: { attachmentId: 'a', mediaType: 'image/png', dataBase64: 'x', scopeKey: 'quest-a' },
      });

      expect(result).toBe(false);
    });
  });

  describe('non-object records', () => {
    it('EMPTY: {record: null} => returns false', () => {
      expect(isLegacyComposerScopeRecordGuard({ record: null })).toBe(false);
    });

    it('EMPTY: {record: undefined} => returns false', () => {
      expect(isLegacyComposerScopeRecordGuard({})).toBe(false);
    });

    it('INVALID: {record: "a string"} => returns false', () => {
      expect(isLegacyComposerScopeRecordGuard({ record: 'a string' })).toBe(false);
    });
  });
});
