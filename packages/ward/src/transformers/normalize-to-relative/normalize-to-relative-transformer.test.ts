import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

import { GitRelativePathStub } from '../../contracts/git-relative-path/git-relative-path.stub';

import { normalizeToRelativeTransformer } from './normalize-to-relative-transformer';

describe('normalizeToRelativeTransformer', () => {
  describe('absolute path with cwd prefix', () => {
    it('VALID: {filePath starts with cwd} => strips cwd prefix', () => {
      const result = normalizeToRelativeTransformer({
        filePath: GitRelativePathStub({ value: '/project/src/a.ts' }),
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBe('src/a.ts');
    });
  });

  describe('already relative path', () => {
    it('VALID: {filePath is relative} => returns unchanged', () => {
      const result = normalizeToRelativeTransformer({
        filePath: GitRelativePathStub({ value: 'src/a.ts' }),
        cwd: AbsoluteFilePathStub({ value: '/project' }),
      });

      expect(result).toBe('src/a.ts');
    });
  });

  describe('cwd with trailing slash', () => {
    it('EDGE: {cwd ends with slash} => strips correctly', () => {
      const result = normalizeToRelativeTransformer({
        filePath: GitRelativePathStub({ value: '/project/src/b.ts' }),
        cwd: AbsoluteFilePathStub({ value: '/project/' }),
      });

      expect(result).toBe('src/b.ts');
    });
  });
});
