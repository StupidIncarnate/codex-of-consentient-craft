import { GitRelativePathStub } from './git-relative-path.stub';
import { gitRelativePathContract } from './git-relative-path-contract';

describe('gitRelativePathContract', () => {
  describe('valid paths', () => {
    it('VALID: {simple path} => parses successfully', () => {
      const result = gitRelativePathContract.parse('src/file.ts');

      expect(result).toBe('src/file.ts');
    });

    it('VALID: {nested path} => parses successfully', () => {
      const result = gitRelativePathContract.parse('src/nested/deep/file.ts');

      expect(result).toBe('src/nested/deep/file.ts');
    });

    it('VALID: {path with ./ prefix} => parses successfully', () => {
      const result = gitRelativePathContract.parse('./src/file.ts');

      expect(result).toBe('./src/file.ts');
    });

    it('VALID: {path with ../ prefix} => parses successfully', () => {
      const result = gitRelativePathContract.parse('../src/file.ts');

      expect(result).toBe('../src/file.ts');
    });

    it('VALID: {stub usage} => creates GitRelativePath', () => {
      const result = GitRelativePathStub({ value: 'src/file.ts' });

      expect(result).toBe('src/file.ts');
    });
  });

  describe('invalid paths', () => {
    it('INVALID: {empty string} => throws error', () => {
      expect(() => gitRelativePathContract.parse('')).toThrow(
        'String must contain at least 1 character(s)',
      );
    });
  });
});
