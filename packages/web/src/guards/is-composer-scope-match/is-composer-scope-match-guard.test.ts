import { ComposerScopeKeyStub } from '../../contracts/composer-scope-key/composer-scope-key.stub';

import { isComposerScopeMatchGuard } from './is-composer-scope-match-guard';

describe('isComposerScopeMatchGuard', () => {
  describe('matching scope', () => {
    it('VALID: {record: {scopeKey: "quest-a", ...}, scopeKey: "quest-a"} => returns true', () => {
      const scopeKey = ComposerScopeKeyStub({ value: 'quest-a' });

      const result = isComposerScopeMatchGuard({
        record: { attachmentId: 'a', scopeKey: 'quest-a' },
        scopeKey,
      });

      expect(result).toBe(true);
    });
  });

  describe('mismatched scope', () => {
    it('INVALID: {record: {scopeKey: "quest-b"}, scopeKey: "quest-a"} => returns false', () => {
      const scopeKey = ComposerScopeKeyStub({ value: 'quest-a' });

      const result = isComposerScopeMatchGuard({
        record: { attachmentId: 'a', scopeKey: 'quest-b' },
        scopeKey,
      });

      expect(result).toBe(false);
    });
  });

  describe('legacy record with no scopeKey field', () => {
    it('EDGE: {record: {attachmentId: "a"}, scopeKey: "create"} => returns false', () => {
      const scopeKey = ComposerScopeKeyStub({ value: 'create' });

      const result = isComposerScopeMatchGuard({ record: { attachmentId: 'a' }, scopeKey });

      expect(result).toBe(false);
    });
  });

  describe('non-object records', () => {
    it('EMPTY: {record: null, scopeKey: "create"} => returns false', () => {
      const scopeKey = ComposerScopeKeyStub({ value: 'create' });

      expect(isComposerScopeMatchGuard({ record: null, scopeKey })).toBe(false);
    });

    it('EMPTY: {record: undefined, scopeKey: "create"} => returns false', () => {
      const scopeKey = ComposerScopeKeyStub({ value: 'create' });

      expect(isComposerScopeMatchGuard({ scopeKey })).toBe(false);
    });

    it('INVALID: {record: "a string", scopeKey: "create"} => returns false', () => {
      const scopeKey = ComposerScopeKeyStub({ value: 'create' });

      expect(isComposerScopeMatchGuard({ record: 'a string', scopeKey })).toBe(false);
    });
  });
});
