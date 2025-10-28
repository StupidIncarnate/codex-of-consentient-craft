import { fsGlobAdapter } from './fs-glob-adapter';
import { fsGlobAdapterProxy } from './fs-glob-adapter.proxy';
import { GlobPatternStub } from '../../../contracts/glob-pattern/glob-pattern.stub';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { AbsolutePathStub } from '../../../contracts/absolute-path/absolute-path.stub';

type FilePath = ReturnType<typeof FilePathStub>;

describe('fsGlobAdapter', () => {
  it('VALID: {pattern: "**/*.ts"} => returns array of .ts files', async () => {
    const adapterProxy = fsGlobAdapterProxy();

    const pattern = GlobPatternStub({ value: '**/*.ts' });
    const expectedFiles: FilePath[] = [
      FilePathStub({ value: '/project/src/file1.ts' }),
      FilePathStub({ value: '/project/src/file2.ts' }),
    ];

    adapterProxy.returns({ pattern, files: expectedFiles });

    const result = await fsGlobAdapter({ pattern });

    expect(result).toStrictEqual(expectedFiles);
  });

  it('VALID: {pattern: "**/*.tsx"} => returns array of .tsx files', async () => {
    const adapterProxy = fsGlobAdapterProxy();

    const pattern = GlobPatternStub({ value: '**/*.tsx' });
    const expectedFiles: FilePath[] = [
      FilePathStub({ value: '/project/src/component1.tsx' }),
      FilePathStub({ value: '/project/src/component2.tsx' }),
    ];

    adapterProxy.returns({ pattern, files: expectedFiles });

    const result = await fsGlobAdapter({ pattern });

    expect(result).toStrictEqual(expectedFiles);
  });

  it('VALID: {pattern: "src/guards/**/*.ts", cwd: "/project"} => returns only guard files', async () => {
    const adapterProxy = fsGlobAdapterProxy();

    const pattern = GlobPatternStub({ value: 'src/guards/**/*.ts' });
    const cwd = AbsolutePathStub({ value: '/project' });
    const expectedFiles: FilePath[] = [
      FilePathStub({ value: '/project/src/guards/is-valid-guard.ts' }),
      FilePathStub({ value: '/project/src/guards/has-permission-guard.ts' }),
    ];

    adapterProxy.returns({ pattern, files: expectedFiles });

    const result = await fsGlobAdapter({ pattern, cwd });

    expect(result).toStrictEqual(expectedFiles);
  });

  it('EMPTY: {pattern: "nonexistent/**"} => returns empty array', async () => {
    const adapterProxy = fsGlobAdapterProxy();

    const pattern = GlobPatternStub({ value: 'nonexistent/**' });
    const expectedFiles: FilePath[] = [];

    adapterProxy.returns({ pattern, files: expectedFiles });

    const result = await fsGlobAdapter({ pattern });

    expect(result).toStrictEqual([]);
  });
});
