import { diffFiles } from './diff-files';
import { diffFilesProxy } from './diff-files.proxy';

describe('diffFiles()', () => {
  it('VALID: {comparison: default} => diffs baseRef...HEAD, returns file paths', async () => {
    const proxy = diffFilesProxy();
    proxy.setupResult({
      revisionArg: 'a1b2c3d4...HEAD',
      exitCode: 0,
      output: 'packages/a/file.ts\npackages/b/file.ts\n',
    });

    const result = await diffFiles({ cwd: '/repo', baseRef: 'a1b2c3d4' });

    expect(result).toStrictEqual(['packages/a/file.ts', 'packages/b/file.ts']);
  });

  it('VALID: {comparison: "ref-to-working-tree"} => diffs baseRef alone', async () => {
    const proxy = diffFilesProxy();
    proxy.setupResult({ revisionArg: 'a1b2c3d4', exitCode: 0, output: 'packages/a/file.ts\n' });

    const result = await diffFiles({
      cwd: '/repo',
      baseRef: 'a1b2c3d4',
      comparison: 'ref-to-working-tree',
    });

    expect(result).toStrictEqual(['packages/a/file.ts']);
  });

  it('ERROR: {exitCode: 128} => throws naming the command and output', async () => {
    const proxy = diffFilesProxy();
    proxy.setupResult({
      revisionArg: 'a1b2c3d4...HEAD',
      exitCode: 128,
      output: 'fatal: bad revision',
    });

    await expect(diffFiles({ cwd: '/repo', baseRef: 'a1b2c3d4' })).rejects.toStrictEqual(
      new Error('git diff a1b2c3d4...HEAD failed with exit code 128: fatal: bad revision'),
    );
  });

  it('EMPTY: {output: ""} => returns an empty array', async () => {
    const proxy = diffFilesProxy();
    proxy.setupResult({ revisionArg: 'a1b2c3d4...HEAD', exitCode: 0, output: '' });

    const result = await diffFiles({ cwd: '/repo', baseRef: 'a1b2c3d4' });

    expect(result).toStrictEqual([]);
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingRevisionArg, a predicate} => resolves for a revision arg the predicate accepts', async () => {
      const proxy = diffFilesProxy();
      proxy.returnsMatchingRevisionArg({
        revisionArg: (value) => String(value).endsWith('...HEAD'),
        exitCode: 0,
        output: 'packages/a/file.ts\n',
      });

      const result = await diffFiles({ cwd: '/repo', baseRef: 'computed-at-runtime' });

      expect(result).toStrictEqual(['packages/a/file.ts']);
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the actual cwd', async () => {
      const proxy = diffFilesProxy();
      proxy.setupResult({ revisionArg: 'a1b2c3d4...HEAD', exitCode: 0, output: '' });

      await diffFiles({ cwd: '/worktrees/computed-at-runtime', baseRef: 'a1b2c3d4' });

      expect(proxy.getCallsFor({ revisionArg: 'a1b2c3d4...HEAD' })).toStrictEqual([
        [
          {
            command: 'git',
            args: ['diff', 'a1b2c3d4...HEAD', '--name-only'],
            cwd: '/worktrees/computed-at-runtime',
          },
        ],
      ]);
    });
  });
});
