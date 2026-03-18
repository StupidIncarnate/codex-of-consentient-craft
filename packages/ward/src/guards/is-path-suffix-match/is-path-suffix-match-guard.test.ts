import { ErrorEntryStub } from '../../contracts/error-entry/error-entry.stub';
import { TestFailureStub } from '../../contracts/test-failure/test-failure.stub';
import { isPathSuffixMatchGuard } from './is-path-suffix-match-guard';

describe('isPathSuffixMatchGuard', () => {
  describe('exact match', () => {
    it('VALID: {storedPath: same as queryPath} => returns true', () => {
      const { filePath } = ErrorEntryStub({ filePath: 'src/index.ts' });

      const result = isPathSuffixMatchGuard({ storedPath: filePath, queryPath: filePath });

      expect(result).toBe(true);
    });
  });

  describe('suffix match: query is suffix of stored', () => {
    it('VALID: {storedPath: absolute, queryPath: repo-relative} => returns true', () => {
      const { filePath: storedPath } = ErrorEntryStub({
        filePath:
          '/home/user/projects/repo/packages/ward/src/guards/is-check-type/is-check-type-guard.ts',
      });
      const { filePath: queryPath } = ErrorEntryStub({
        filePath: 'packages/ward/src/guards/is-check-type/is-check-type-guard.ts',
      });

      const result = isPathSuffixMatchGuard({ storedPath, queryPath });

      expect(result).toBe(true);
    });

    it('VALID: {storedPath: absolute, queryPath: package-relative} => returns true', () => {
      const { filePath: storedPath } = ErrorEntryStub({
        filePath:
          '/home/user/projects/repo/packages/ward/src/guards/is-check-type/is-check-type-guard.ts',
      });
      const { filePath: queryPath } = ErrorEntryStub({
        filePath: 'src/guards/is-check-type/is-check-type-guard.ts',
      });

      const result = isPathSuffixMatchGuard({ storedPath, queryPath });

      expect(result).toBe(true);
    });
  });

  describe('suffix match: stored is suffix of query', () => {
    it('VALID: {storedPath: package-relative, queryPath: absolute} => returns true', () => {
      const { filePath: storedPath } = ErrorEntryStub({
        filePath: 'src/guards/is-check-type/is-check-type-guard.ts',
      });
      const { filePath: queryPath } = ErrorEntryStub({
        filePath:
          '/home/user/projects/repo/packages/ward/src/guards/is-check-type/is-check-type-guard.ts',
      });

      const result = isPathSuffixMatchGuard({ storedPath, queryPath });

      expect(result).toBe(true);
    });
  });

  describe('suitePath matching', () => {
    it('VALID: {storedPath: suitePath relative, queryPath: suitePath absolute} => returns true', () => {
      const { suitePath: storedPath } = TestFailureStub({
        suitePath: 'src/guards/is-check-type/is-check-type-guard.test.ts',
      });
      const { suitePath: queryPath } = TestFailureStub({
        suitePath:
          '/home/user/projects/repo/packages/ward/src/guards/is-check-type/is-check-type-guard.test.ts',
      });

      const result = isPathSuffixMatchGuard({ storedPath, queryPath });

      expect(result).toBe(true);
    });
  });

  describe('no match', () => {
    it('INVALID_PATH: {storedPath: unrelated to queryPath} => returns false', () => {
      const { filePath: storedPath } = ErrorEntryStub({
        filePath:
          '/home/user/projects/repo/packages/ward/src/guards/is-check-type/is-check-type-guard.ts',
      });
      const { filePath: queryPath } = ErrorEntryStub({
        filePath: 'packages/other/src/completely-different.ts',
      });

      const result = isPathSuffixMatchGuard({ storedPath, queryPath });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {storedPath: undefined} => returns false', () => {
      const { filePath: queryPath } = ErrorEntryStub({ filePath: 'src/index.ts' });

      const result = isPathSuffixMatchGuard({ queryPath });

      expect(result).toBe(false);
    });

    it('EMPTY: {queryPath: undefined} => returns false', () => {
      const { filePath: storedPath } = ErrorEntryStub({ filePath: 'src/index.ts' });

      const result = isPathSuffixMatchGuard({ storedPath });

      expect(result).toBe(false);
    });

    it('EMPTY: {both undefined} => returns false', () => {
      const result = isPathSuffixMatchGuard({});

      expect(result).toBe(false);
    });
  });
});
