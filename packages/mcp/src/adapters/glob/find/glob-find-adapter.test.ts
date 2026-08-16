import { globFindAdapter } from './glob-find-adapter';
import { globFindAdapterProxy } from './glob-find-adapter.proxy';
import { GlobPatternStub, PathSegmentStub } from '@dungeonmaster/shared/contracts';

const IGNORE = [GlobPatternStub({ value: '**/node_modules/**' })];

describe('globFindAdapter', () => {
  it('VALID: {pattern: "**/*.ts", cwd: "/home/project"} => returns array of .ts files', async () => {
    const adapterProxy = globFindAdapterProxy();
    const pattern = GlobPatternStub({ value: '**/*.ts' });
    const cwd = PathSegmentStub({ value: '/home/project' });
    const expectedFiles = [
      PathSegmentStub({ value: '/home/project/src/file1.ts' }),
      PathSegmentStub({ value: '/home/project/src/file2.ts' }),
    ];

    adapterProxy.returns({ pattern, files: expectedFiles });

    const result = await globFindAdapter({ pattern, cwd, ignore: IGNORE });

    expect(result).toStrictEqual(expectedFiles);
  });

  it('VALID: {pattern: "**/*.tsx", cwd: "/custom/path"} => returns array of .tsx files from cwd', async () => {
    const adapterProxy = globFindAdapterProxy();
    const pattern = GlobPatternStub({ value: '**/*.tsx' });
    const cwd = PathSegmentStub({ value: '/custom/path' });
    const expectedFiles = [PathSegmentStub({ value: '/custom/path/src/component.tsx' })];

    adapterProxy.returns({ pattern, files: expectedFiles });

    const result = await globFindAdapter({ pattern, cwd, ignore: IGNORE });

    expect(result).toStrictEqual(expectedFiles);
  });

  it('EMPTY: {pattern: "nonexistent/**", cwd: "/home/project"} => returns empty array', async () => {
    const adapterProxy = globFindAdapterProxy();
    const pattern = GlobPatternStub({ value: 'nonexistent/**' });
    const cwd = PathSegmentStub({ value: '/home/project' });
    const expectedFiles: ReturnType<typeof PathSegmentStub>[] = [];

    adapterProxy.returns({ pattern, files: expectedFiles });

    const result = await globFindAdapter({ pattern, cwd, ignore: IGNORE });

    expect(result).toStrictEqual([]);
  });

  it('VALID: {ignore: given list} => hands that exact list to glob alongside cwd, absolute and nodir', async () => {
    const adapterProxy = globFindAdapterProxy();
    const pattern = GlobPatternStub({ value: '**/*.ts' });
    const cwd = PathSegmentStub({ value: '/home/project' });

    adapterProxy.returns({ pattern, files: [] });

    await globFindAdapter({
      pattern,
      cwd,
      ignore: [
        GlobPatternStub({ value: '**/node_modules/**' }),
        GlobPatternStub({ value: '**/worktrees/**' }),
      ],
    });

    expect(adapterProxy.getOptionsFor({ pattern })).toStrictEqual({
      cwd: '/home/project',
      absolute: true,
      nodir: true,
      ignore: ['**/node_modules/**', '**/worktrees/**'],
    });
  });
});
