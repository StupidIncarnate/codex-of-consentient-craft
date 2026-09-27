import { commit } from './commit';
import { commitProxy } from './commit.proxy';

describe('commit()', () => {
  it('VALID: {message: "work items: 3"} => runs plain commit, returns the result', async () => {
    const proxy = commitProxy();
    proxy.setupResult({ message: 'work items: 3', exitCode: 0, output: '' });

    const result = await commit({ cwd: '/repo', message: 'work items: 3' });

    expect(result).toStrictEqual({ exitCode: 0, output: '' });
  });

  it('VALID: {message, allowEmpty: true} => runs commit --allow-empty, returns the result', async () => {
    const proxy = commitProxy();
    proxy.setupResult({
      message: 'ward/commit: repair',
      allowEmpty: true,
      exitCode: 0,
      output: '',
    });

    const result = await commit({ cwd: '/repo', message: 'ward/commit: repair', allowEmpty: true });

    expect(result).toStrictEqual({ exitCode: 0, output: '' });
  });

  it('ERROR: {exitCode: 1, output: "nothing to commit"} => returns it, does not throw', async () => {
    const proxy = commitProxy();
    proxy.setupResult({ message: 'x', exitCode: 1, output: 'nothing to commit' });

    const result = await commit({ cwd: '/repo', message: 'x' });

    expect(result).toStrictEqual({ exitCode: 1, output: 'nothing to commit' });
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingMessage, a predicate} => resolves for a message the predicate accepts', async () => {
      const proxy = commitProxy();
      proxy.returnsMatchingMessage({
        message: (value) => String(value).startsWith('work items:'),
        exitCode: 0,
        output: '',
      });

      const result = await commit({ cwd: '/repo', message: 'work items: computed at runtime' });

      expect(result).toStrictEqual({ exitCode: 0, output: '' });
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the actual cwd', async () => {
      const proxy = commitProxy();
      proxy.setupResult({ message: 'work items: 3', exitCode: 0, output: '' });

      await commit({ cwd: '/worktrees/computed-at-runtime', message: 'work items: 3' });

      expect(proxy.getCallsFor({ message: 'work items: 3' })).toStrictEqual([
        [
          {
            command: 'git',
            args: ['commit', '-m', 'work items: 3'],
            cwd: '/worktrees/computed-at-runtime',
          },
        ],
      ]);
    });
  });
});
