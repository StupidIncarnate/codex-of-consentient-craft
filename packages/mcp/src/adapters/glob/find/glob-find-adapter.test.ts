import { globFindAdapter } from './glob-find-adapter';
import { globFindAdapterProxy } from './glob-find-adapter.proxy';
import { GlobPatternStub, PathSegmentStub } from '@dungeonmaster/shared/contracts';

describe('globFindAdapter', () => {
  it('VALID: {pattern: "**/*.ts"} => returns array of .ts files', async () => {
    const adapterProxy = globFindAdapterProxy();
    const pattern = GlobPatternStub({ value: '**/*.ts' });
    const expectedFiles = [
      PathSegmentStub({ value: '/home/project/src/file1.ts' }),
      PathSegmentStub({ value: '/home/project/src/file2.ts' }),
    ];

    adapterProxy.returns({ pattern, files: expectedFiles });

    const result = await globFindAdapter({ pattern });

    expect(result).toStrictEqual(expectedFiles);
  });

  it('VALID: {pattern: "**/*.tsx", cwd: "/custom/path"} => returns array of .tsx files from cwd', async () => {
    const adapterProxy = globFindAdapterProxy();
    const pattern = GlobPatternStub({ value: '**/*.tsx' });
    const cwd = PathSegmentStub({ value: '/custom/path' });
    const expectedFiles = [PathSegmentStub({ value: '/custom/path/src/component.tsx' })];

    adapterProxy.returns({ pattern, files: expectedFiles });

    const result = await globFindAdapter({ pattern, cwd });

    expect(result).toStrictEqual(expectedFiles);
  });

  it('EMPTY: {pattern: "nonexistent/**"} => returns empty array', async () => {
    const adapterProxy = globFindAdapterProxy();
    const pattern = GlobPatternStub({ value: 'nonexistent/**' });
    const expectedFiles: ReturnType<typeof PathSegmentStub>[] = [];

    adapterProxy.returns({ pattern, files: expectedFiles });

    const result = await globFindAdapter({ pattern });

    expect(result).toStrictEqual([]);
  });
});
