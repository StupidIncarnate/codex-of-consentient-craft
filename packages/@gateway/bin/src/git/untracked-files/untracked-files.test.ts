import { untrackedFiles } from './untracked-files';
import { untrackedFilesProxy } from './untracked-files.proxy';

describe('untrackedFiles()', () => {
  it('VALID: {output: two files} => returns file paths', async () => {
    const proxy = untrackedFilesProxy();
    proxy.setupResult({ exitCode: 0, output: 'packages/a/new.ts\npackages/b/new.ts\n' });

    const result = await untrackedFiles({ cwd: '/repo' });

    expect(result).toStrictEqual(['packages/a/new.ts', 'packages/b/new.ts']);
  });

  it('ERROR: {exitCode: 128} => throws naming the command and output', async () => {
    const proxy = untrackedFilesProxy();
    proxy.setupResult({ exitCode: 128, output: 'fatal: not a git repository' });

    await expect(untrackedFiles({ cwd: '/repo' })).rejects.toStrictEqual(
      new Error(
        'git ls-files --others --exclude-standard failed with exit code 128: fatal: not a git repository',
      ),
    );
  });

  it('EMPTY: {output: ""} => returns an empty array', async () => {
    const proxy = untrackedFilesProxy();
    proxy.setupResult({ exitCode: 0, output: '' });

    const result = await untrackedFiles({ cwd: '/repo' });

    expect(result).toStrictEqual([]);
  });
});
