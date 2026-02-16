import { GitRelativePathStub } from '../../contracts/git-relative-path/git-relative-path.stub';
import { parseDiffOutputTransformer } from './parse-diff-output-transformer';

describe('parseDiffOutputTransformer', () => {
  describe('valid output', () => {
    it('VALID: {output with multiple files} => returns array of GitRelativePath', () => {
      const result = parseDiffOutputTransformer({
        output: 'src/file1.ts\nsrc/file2.ts\n',
      });

      expect(result).toStrictEqual([
        GitRelativePathStub({ value: 'src/file1.ts' }),
        GitRelativePathStub({ value: 'src/file2.ts' }),
      ]);
    });

    it('VALID: {output with single file} => returns single-element array', () => {
      const result = parseDiffOutputTransformer({
        output: 'src/changed.ts\n',
      });

      expect(result).toStrictEqual([GitRelativePathStub({ value: 'src/changed.ts' })]);
    });
  });

  describe('empty output', () => {
    it('EMPTY: {empty string} => returns empty array', () => {
      const result = parseDiffOutputTransformer({ output: '' });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {whitespace only} => returns empty array', () => {
      const result = parseDiffOutputTransformer({ output: '  \n  \n' });

      expect(result).toStrictEqual([]);
    });
  });
});
