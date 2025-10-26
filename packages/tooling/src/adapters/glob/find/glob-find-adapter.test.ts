import { globFindAdapter } from './glob-find-adapter';
import { globFindAdapterProxy } from './glob-find-adapter.proxy';
import { GlobPatternStub } from '../../../contracts/glob-pattern/glob-pattern.stub';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('globFindAdapter', () => {
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
