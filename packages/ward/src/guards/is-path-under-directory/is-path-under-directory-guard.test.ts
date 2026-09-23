import { isPathUnderDirectoryGuard } from './is-path-under-directory-guard';

describe('isPathUnderDirectoryGuard', () => {
  describe('a path under the directory', () => {
    it('VALID: {path: "src/widgets/foo.ts", directory: "src/widgets"} => returns true', () => {
      const result = isPathUnderDirectoryGuard({
        path: 'src/widgets/foo.ts',
        directory: 'src/widgets',
      });

      expect(result).toBe(true);
    });

    it('VALID: {path: "src/widgets/deep/nested/foo.ts", directory: "src/widgets"} => returns true', () => {
      const result = isPathUnderDirectoryGuard({
        path: 'src/widgets/deep/nested/foo.ts',
        directory: 'src/widgets',
      });

      expect(result).toBe(true);
    });

    it('VALID: {path equals the directory itself} => returns true', () => {
      const result = isPathUnderDirectoryGuard({ path: 'src/widgets', directory: 'src/widgets' });

      expect(result).toBe(true);
    });

    it('VALID: {directory carries a trailing slash} => returns true', () => {
      const result = isPathUnderDirectoryGuard({
        path: 'src/widgets/foo.ts',
        directory: 'src/widgets/',
      });

      expect(result).toBe(true);
    });
  });

  describe('a same-prefix sibling, not a path under the directory', () => {
    // THE SEPARATOR IS THE WHOLE FIX. A plain string prefix check on `src/widget` would also claim
    // `src/widgets-extra`, which is a sibling directory it never contains.
    it('INVALID: {path: "src/widgets-extra/foo.ts", directory: "src/widget"} => returns false', () => {
      const result = isPathUnderDirectoryGuard({
        path: 'src/widgets-extra/foo.ts',
        directory: 'src/widget',
      });

      expect(result).toBe(false);
    });

    it('INVALID: {path: "src/widget", directory: "src/widgets"} => returns false', () => {
      const result = isPathUnderDirectoryGuard({ path: 'src/widget', directory: 'src/widgets' });

      expect(result).toBe(false);
    });
  });

  describe('an unrelated path', () => {
    it('INVALID: {path: "src/other/foo.ts", directory: "src/widgets"} => returns false', () => {
      const result = isPathUnderDirectoryGuard({
        path: 'src/other/foo.ts',
        directory: 'src/widgets',
      });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {path: undefined} => returns false', () => {
      const result = isPathUnderDirectoryGuard({ directory: 'src/widgets' });

      expect(result).toBe(false);
    });

    it('EMPTY: {directory: undefined} => returns false', () => {
      const result = isPathUnderDirectoryGuard({ path: 'src/widgets/foo.ts' });

      expect(result).toBe(false);
    });

    it('EMPTY: {directory: ""} => returns false', () => {
      const result = isPathUnderDirectoryGuard({ path: 'src/widgets/foo.ts', directory: '' });

      expect(result).toBe(false);
    });
  });
});
