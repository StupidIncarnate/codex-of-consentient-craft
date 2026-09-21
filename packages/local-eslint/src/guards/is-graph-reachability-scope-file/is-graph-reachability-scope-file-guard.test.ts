import { isGraphReachabilityScopeFileGuard } from './is-graph-reachability-scope-file-guard';

const scopeFilePaths = ['packages/shared/src/statics/quest-flow/quest-flow-statics.ts'];

describe('isGraphReachabilityScopeFileGuard', () => {
  describe('valid input', () => {
    it('VALID: {filename: the scope file, absolute path} => returns true', () => {
      const result = isGraphReachabilityScopeFileGuard({
        filename: '/repo/packages/shared/src/statics/quest-flow/quest-flow-statics.ts',
        scopeFilePaths,
      });

      expect(result).toBe(true);
    });

    it('VALID: {filename: a Windows-style path to the scope file} => returns true', () => {
      const result = isGraphReachabilityScopeFileGuard({
        filename: 'C:\\repo\\packages\\shared\\src\\statics\\quest-flow\\quest-flow-statics.ts',
        scopeFilePaths,
      });

      expect(result).toBe(true);
    });
  });

  describe('invalid input', () => {
    it('INVALID: {filename: a different file} => returns false', () => {
      const result = isGraphReachabilityScopeFileGuard({
        filename: '/repo/packages/web/src/widgets/quest-chat/quest-chat-widget.tsx',
        scopeFilePaths,
      });

      expect(result).toBe(false);
    });

    it('INVALID: {filename: the scope file test, not the file itself} => returns false', () => {
      const result = isGraphReachabilityScopeFileGuard({
        filename: '/repo/packages/shared/src/statics/quest-flow/quest-flow-statics.test.ts',
        scopeFilePaths,
      });

      expect(result).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {filename: undefined} => returns false', () => {
      const result = isGraphReachabilityScopeFileGuard({ scopeFilePaths });

      expect(result).toBe(false);
    });

    it('EMPTY: {filename: ""} => returns false', () => {
      const result = isGraphReachabilityScopeFileGuard({ filename: '', scopeFilePaths });

      expect(result).toBe(false);
    });

    it('EMPTY: {scopeFilePaths: undefined} => returns false', () => {
      const result = isGraphReachabilityScopeFileGuard({
        filename: '/repo/packages/shared/src/statics/quest-flow/quest-flow-statics.ts',
      });

      expect(result).toBe(false);
    });
  });
});
