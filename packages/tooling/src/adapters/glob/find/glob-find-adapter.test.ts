import { globFindAdapter } from './glob-find-adapter';
import { globFindAdapterProxy } from './glob-find-adapter.proxy';
import { GlobPatternStub } from '../../../contracts/glob-pattern/glob-pattern.stub';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('globFindAdapter', () => {
  describe('valid inputs', () => {
    it('VALID: {pattern: "**/*.ts"} => returns matching file paths', async () => {
      const adapterProxy = globFindAdapterProxy();
      const pattern = GlobPatternStub({ value: '**/*.ts' });
      const filePaths = [
        AbsoluteFilePathStub({ value: '/home/user/file1.ts' }),
        AbsoluteFilePathStub({ value: '/home/user/file2.ts' }),
      ];

      adapterProxy.returns({ pattern, filePaths });

      const result = await globFindAdapter({ pattern });

      expect(result).toStrictEqual(['/home/user/file1.ts', '/home/user/file2.ts']);
    });

    it('VALID: {pattern: "src/**/*.tsx", cwd: "/project"} => returns matching file paths', async () => {
      const adapterProxy = globFindAdapterProxy();
      const pattern = GlobPatternStub({ value: 'src/**/*.tsx' });
      const cwd = AbsoluteFilePathStub({ value: '/project' });
      const filePaths = [AbsoluteFilePathStub({ value: '/project/src/component.tsx' })];

      adapterProxy.returns({ pattern, filePaths });

      const result = await globFindAdapter({ pattern, cwd });

      expect(result).toStrictEqual(['/project/src/component.tsx']);
    });

    it('EMPTY: {pattern: "*.js"} => returns empty array', async () => {
      const adapterProxy = globFindAdapterProxy();
      const pattern = GlobPatternStub({ value: '*.js' });
      const filePaths = [] as const;

      adapterProxy.returns({ pattern, filePaths });

      const result = await globFindAdapter({ pattern });

      expect(result).toStrictEqual([]);
    });
  });

  describe('cwd variations', () => {
    it('VALID: {pattern: "**/*.ts", cwd: "/custom/path"} => searches in custom directory', async () => {
      const adapterProxy = globFindAdapterProxy();
      const pattern = GlobPatternStub({ value: '**/*.ts' });
      const cwd = AbsoluteFilePathStub({ value: '/custom/path' });
      const filePaths = [AbsoluteFilePathStub({ value: '/custom/path/file.ts' })];

      adapterProxy.returns({ pattern, filePaths });

      const result = await globFindAdapter({ pattern, cwd });

      expect(result).toStrictEqual(['/custom/path/file.ts']);
    });

    it('VALID: {pattern: "**/*.ts", cwd: omitted} => searches in current directory', async () => {
      const adapterProxy = globFindAdapterProxy();
      const pattern = GlobPatternStub({ value: '**/*.ts' });
      const filePaths = [
        AbsoluteFilePathStub({ value: '/current/dir/file1.ts' }),
        AbsoluteFilePathStub({ value: '/current/dir/file2.ts' }),
      ];

      adapterProxy.returns({ pattern, filePaths });

      const result = await globFindAdapter({ pattern });

      expect(result).toStrictEqual(['/current/dir/file1.ts', '/current/dir/file2.ts']);
    });
  });

  describe('pattern edge cases', () => {
    it('VALID: {pattern: "*"} => returns files matching single wildcard', async () => {
      const adapterProxy = globFindAdapterProxy();
      const pattern = GlobPatternStub({ value: '*' });
      const filePaths = [
        AbsoluteFilePathStub({ value: '/home/file1.ts' }),
        AbsoluteFilePathStub({ value: '/home/file2.js' }),
      ];

      adapterProxy.returns({ pattern, filePaths });

      const result = await globFindAdapter({ pattern });

      expect(result).toStrictEqual(['/home/file1.ts', '/home/file2.js']);
    });

    it('VALID: {pattern: "**"} => returns files matching recursive wildcard', async () => {
      const adapterProxy = globFindAdapterProxy();
      const pattern = GlobPatternStub({ value: '**' });
      const filePaths = [
        AbsoluteFilePathStub({ value: '/home/dir1/file1.ts' }),
        AbsoluteFilePathStub({ value: '/home/dir2/nested/file2.ts' }),
      ];

      adapterProxy.returns({ pattern, filePaths });

      const result = await globFindAdapter({ pattern });

      expect(result).toStrictEqual(['/home/dir1/file1.ts', '/home/dir2/nested/file2.ts']);
    });

    it('VALID: {pattern: "*.{ts,tsx,js}"} => returns files matching multiple extensions', async () => {
      const adapterProxy = globFindAdapterProxy();
      const pattern = GlobPatternStub({ value: '*.{ts,tsx,js}' });
      const filePaths = [
        AbsoluteFilePathStub({ value: '/home/file1.ts' }),
        AbsoluteFilePathStub({ value: '/home/file2.tsx' }),
        AbsoluteFilePathStub({ value: '/home/file3.js' }),
      ];

      adapterProxy.returns({ pattern, filePaths });

      const result = await globFindAdapter({ pattern });

      expect(result).toStrictEqual(['/home/file1.ts', '/home/file2.tsx', '/home/file3.js']);
    });

    it('VALID: {pattern: "src/**/!(*.test).ts"} => returns files matching complex negation', async () => {
      const adapterProxy = globFindAdapterProxy();
      const pattern = GlobPatternStub({ value: 'src/**/!(*.test).ts' });
      const filePaths = [
        AbsoluteFilePathStub({ value: '/project/src/file.ts' }),
        AbsoluteFilePathStub({ value: '/project/src/utils/helper.ts' }),
      ];

      adapterProxy.returns({ pattern, filePaths });

      const result = await globFindAdapter({ pattern });

      expect(result).toStrictEqual(['/project/src/file.ts', '/project/src/utils/helper.ts']);
    });

    it('EMPTY: {pattern: "no-match-*.ts"} => returns empty array when no files match', async () => {
      const adapterProxy = globFindAdapterProxy();
      const pattern = GlobPatternStub({ value: 'no-match-*.ts' });
      const filePaths = [] as const;

      adapterProxy.returns({ pattern, filePaths });

      const result = await globFindAdapter({ pattern });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {pattern: "single.ts"} => returns single file match', async () => {
      const adapterProxy = globFindAdapterProxy();
      const pattern = GlobPatternStub({ value: 'single.ts' });
      const filePaths = [AbsoluteFilePathStub({ value: '/home/single.ts' })];

      adapterProxy.returns({ pattern, filePaths });

      const result = await globFindAdapter({ pattern });

      expect(result).toStrictEqual(['/home/single.ts']);
    });

    it('VALID: {pattern: "**/*.ts"} => returns many files when multiple matches', async () => {
      const adapterProxy = globFindAdapterProxy();
      const pattern = GlobPatternStub({ value: '**/*.ts' });
      const filePaths = Array.from({ length: 100 }, (_, index) => {
        return AbsoluteFilePathStub({ value: `/project/file${index}.ts` });
      });

      adapterProxy.returns({ pattern, filePaths });

      const result = await globFindAdapter({ pattern });

      expect(result).toStrictEqual(
        Array.from({ length: 100 }, (_, index) => {
          return `/project/file${index}.ts`;
        }),
      );
    });

    it('VALID: {pattern: "[a-z]*.ts"} => returns files matching character classes', async () => {
      const adapterProxy = globFindAdapterProxy();
      const pattern = GlobPatternStub({ value: '[a-z]*.ts' });
      const filePaths = [
        AbsoluteFilePathStub({ value: '/home/alpha.ts' }),
        AbsoluteFilePathStub({ value: '/home/beta.ts' }),
      ];

      adapterProxy.returns({ pattern, filePaths });

      const result = await globFindAdapter({ pattern });

      expect(result).toStrictEqual(['/home/alpha.ts', '/home/beta.ts']);
    });
  });

  describe('error scenarios', () => {
    it('ERROR: {pattern: "[(invalid"} => throws glob pattern error', async () => {
      const adapterProxy = globFindAdapterProxy();
      const pattern = GlobPatternStub({ value: '[(invalid' });
      const error = new Error('Invalid glob pattern');

      adapterProxy.throws({ pattern, error });

      await expect(globFindAdapter({ pattern })).rejects.toThrow('Invalid glob pattern');
    });

    it('ERROR: {pattern: "**/*.ts", cwd: "/nonexistent"} => throws cwd does not exist error', async () => {
      const adapterProxy = globFindAdapterProxy();
      const pattern = GlobPatternStub({ value: '**/*.ts' });
      const cwd = AbsoluteFilePathStub({ value: '/nonexistent' });
      const error = new Error('ENOENT: no such file or directory');

      adapterProxy.throws({ pattern, error });

      await expect(globFindAdapter({ pattern, cwd })).rejects.toThrow(
        'ENOENT: no such file or directory',
      );
    });

    it('ERROR: {pattern: "**/*.ts", cwd: "/file.txt"} => throws cwd is file error', async () => {
      const adapterProxy = globFindAdapterProxy();
      const pattern = GlobPatternStub({ value: '**/*.ts' });
      const cwd = AbsoluteFilePathStub({ value: '/file.txt' });
      const error = new Error('ENOTDIR: not a directory');

      adapterProxy.throws({ pattern, error });

      await expect(globFindAdapter({ pattern, cwd })).rejects.toThrow('ENOTDIR: not a directory');
    });

    it('ERROR: {pattern: "**/*.ts", cwd: "/denied"} => throws permission denied error', async () => {
      const adapterProxy = globFindAdapterProxy();
      const pattern = GlobPatternStub({ value: '**/*.ts' });
      const cwd = AbsoluteFilePathStub({ value: '/denied' });
      const error = new Error('EACCES: permission denied');

      adapterProxy.throws({ pattern, error });

      await expect(globFindAdapter({ pattern, cwd })).rejects.toThrow('EACCES: permission denied');
    });
  });
});
