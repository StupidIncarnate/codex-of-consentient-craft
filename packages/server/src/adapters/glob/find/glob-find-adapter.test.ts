import { globFindAdapter } from './glob-find-adapter';
import { globFindAdapterProxy } from './glob-find-adapter.proxy';
import { GlobPatternStub } from '../../../contracts/glob-pattern/glob-pattern.stub';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('globFindAdapter', () => {
  it('DEFENSIVE: {glob returns iterable non-array} => coerces to array and parses', async () => {
    const adapterProxy = globFindAdapterProxy();
    const pattern = GlobPatternStub({ value: '**/*.ts' });
    const expectedFiles = [
      FilePathStub({ value: '/home/project/src/file1.ts' }),
      FilePathStub({ value: '/home/project/src/file2.ts' }),
    ];

    // Simulate glob v7 behavior: returns an iterable non-array object
    adapterProxy.returnsNonArray({ pattern, files: expectedFiles });

    const result = await globFindAdapter({ pattern });

    expect(result).toStrictEqual(expectedFiles);
  });

  it('VALID: {pattern: "**/*.ts"} => returns array of .ts files', async () => {
    const adapterProxy = globFindAdapterProxy();
    const pattern = GlobPatternStub({ value: '**/*.ts' });
    const expectedFiles = [
      FilePathStub({ value: '/home/project/src/file1.ts' }),
      FilePathStub({ value: '/home/project/src/file2.ts' }),
    ];

    adapterProxy.returns({ pattern, files: expectedFiles });

    const result = await globFindAdapter({ pattern });

    expect(result).toStrictEqual(expectedFiles);
  });

  it('VALID: {pattern: "**/*.tsx", cwd: "/custom/path"} => returns array of .tsx files from cwd', async () => {
    const adapterProxy = globFindAdapterProxy();
    const pattern = GlobPatternStub({ value: '**/*.tsx' });
    const cwd = FilePathStub({ value: '/custom/path' });
    const expectedFiles = [FilePathStub({ value: '/custom/path/src/component.tsx' })];

    adapterProxy.returns({ pattern, files: expectedFiles });

    const result = await globFindAdapter({ pattern, cwd });

    expect(result).toStrictEqual(expectedFiles);
  });

  it('ERROR: {glob v7 callback returns error} => rejects with error', async () => {
    const adapterProxy = globFindAdapterProxy();
    const pattern = GlobPatternStub({ value: '**/*.ts' });
    const error = new Error('Glob callback error');

    adapterProxy.throwsNonArray({ pattern, error });

    await expect(globFindAdapter({ pattern })).rejects.toThrow(/Glob callback error/u);
  });

  it('EMPTY: {pattern: "nonexistent/**"} => returns empty array', async () => {
    const adapterProxy = globFindAdapterProxy();
    const pattern = GlobPatternStub({ value: 'nonexistent/**' });
    const expectedFiles: ReturnType<typeof FilePathStub>[] = [];

    adapterProxy.returns({ pattern, files: expectedFiles });

    const result = await globFindAdapter({ pattern });

    expect(result).toStrictEqual([]);
  });
});
