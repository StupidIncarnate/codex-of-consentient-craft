import { repoRelativePathContract } from './repo-relative-path-contract';
import { RepoRelativePathStub as _RepoRelativePathStub } from './repo-relative-path.stub';

describe('repoRelativePathContract', () => {
  describe('valid repo-relative paths', () => {
    it('VALID: {path: "packages/shared/src/contracts/quest/quest-contract.ts"} => parses successfully', () => {
      const result = repoRelativePathContract.parse(
        'packages/shared/src/contracts/quest/quest-contract.ts',
      );

      expect(result).toBe('packages/shared/src/contracts/quest/quest-contract.ts');
    });

    it('VALID: {path: "./src/file.ts"} => parses successfully', () => {
      const result = repoRelativePathContract.parse('./src/file.ts');

      expect(result).toBe('./src/file.ts');
    });

    it('VALID: {path: "../sibling/file.ts"} => parses successfully', () => {
      const result = repoRelativePathContract.parse('../sibling/file.ts');

      expect(result).toBe('../sibling/file.ts');
    });

    it('VALID: {path: "file.ts"} => parses successfully', () => {
      const result = repoRelativePathContract.parse('file.ts');

      expect(result).toBe('file.ts');
    });
  });

  describe('invalid absolute paths', () => {
    it('INVALID: {path: "/home/user/file.ts"} => throws validation error', () => {
      expect(() => {
        return repoRelativePathContract.parse('/home/user/file.ts');
      }).toThrow('Path must be repo-relative (not absolute)');
    });

    it('INVALID: {path: "C:\\\\Windows\\\\path.txt"} => throws validation error', () => {
      expect(() => {
        return repoRelativePathContract.parse('C:\\Windows\\path.txt');
      }).toThrow('Path must be repo-relative (not absolute)');
    });

    it('INVALID: {path: "D:\\\\Projects\\\\app\\\\file.js"} => throws validation error', () => {
      expect(() => {
        return repoRelativePathContract.parse('D:\\Projects\\app\\file.js');
      }).toThrow('Path must be repo-relative (not absolute)');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {path: ""} => throws ZodError', () => {
      expect(() => {
        return repoRelativePathContract.parse('');
      }).toThrow('String must contain at least 1 character');
    });

    it('INVALID: {path: 123} => throws ZodError', () => {
      expect(() => {
        return repoRelativePathContract.parse(123);
      }).toThrow('Expected string');
    });

    it('INVALID: {path: null} => throws ZodError', () => {
      expect(() => {
        return repoRelativePathContract.parse(null);
      }).toThrow('Expected string');
    });
  });
});
