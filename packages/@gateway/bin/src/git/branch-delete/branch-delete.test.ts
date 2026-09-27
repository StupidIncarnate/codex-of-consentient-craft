import { branchDelete } from './branch-delete';
import { branchDeleteProxy } from './branch-delete.proxy';

describe('branchDelete()', () => {
  it('VALID: {branchName: "quest/foo"} => runs git branch -D quest/foo', async () => {
    const proxy = branchDeleteProxy();
    proxy.setupResult({ branchName: 'quest/foo', exitCode: 0, output: '' });

    const result = await branchDelete({ cwd: '/repo', branchName: 'quest/foo' });

    expect(result).toStrictEqual({ exitCode: 0, output: '' });
  });

  it('ERROR: {exitCode: 1, output: "not found"} => returns it, does not throw', async () => {
    const proxy = branchDeleteProxy();
    proxy.setupResult({ branchName: 'quest/foo', exitCode: 1, output: 'not found' });

    const result = await branchDelete({ cwd: '/repo', branchName: 'quest/foo' });

    expect(result).toStrictEqual({ exitCode: 1, output: 'not found' });
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingBranchName, a predicate} => resolves for a branch name the predicate accepts', async () => {
      const proxy = branchDeleteProxy();
      proxy.returnsMatchingBranchName({
        branchName: (value) => String(value).startsWith('quest/'),
        exitCode: 0,
        output: '',
      });

      const result = await branchDelete({ cwd: '/repo', branchName: 'quest/computed-at-runtime' });

      expect(result).toStrictEqual({ exitCode: 0, output: '' });
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the actual cwd', async () => {
      const proxy = branchDeleteProxy();
      proxy.setupResult({ branchName: 'quest/foo', exitCode: 0, output: '' });

      await branchDelete({ cwd: '/worktrees/computed-at-runtime', branchName: 'quest/foo' });

      expect(proxy.getCallsFor({ branchName: 'quest/foo' })).toStrictEqual([
        [
          {
            command: 'git',
            args: ['branch', '-D', 'quest/foo'],
            cwd: '/worktrees/computed-at-runtime',
          },
        ],
      ]);
    });
  });
});
