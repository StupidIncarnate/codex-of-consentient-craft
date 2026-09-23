import { isFilePathGuard } from './is-file-path-guard';

describe('isFilePathGuard', () => {
  describe('a path naming a file', () => {
    it('VALID: {path: "packages/ward/src/a.test.ts"} => returns true', () => {
      const result = isFilePathGuard({ path: 'packages/ward/src/a.test.ts' });

      expect(result).toBe(true);
    });

    it('VALID: {path: "src/index.ts"} => returns true', () => {
      const result = isFilePathGuard({ path: 'src/index.ts' });

      expect(result).toBe(true);
    });
  });

  describe('a path naming a directory or package', () => {
    it('INVALID: {path: "packages/ward"} => returns false', () => {
      const result = isFilePathGuard({ path: 'packages/ward' });

      expect(result).toBe(false);
    });

    it('INVALID: {path: "src/guards"} => returns false', () => {
      const result = isFilePathGuard({ path: 'src/guards' });

      expect(result).toBe(false);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {path: undefined} => returns false', () => {
      const result = isFilePathGuard({});

      expect(result).toBe(false);
    });
  });
});
