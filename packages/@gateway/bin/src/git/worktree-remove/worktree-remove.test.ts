import { worktreeRemove } from './worktree-remove';
import { worktreeRemoveProxy } from './worktree-remove.proxy';

describe('worktreeRemove()', () => {
  it('VALID: {worktreePath} => runs git worktree remove --force <worktreePath>', async () => {
    const proxy = worktreeRemoveProxy();
    proxy.setupResult({ worktreePath: '/repo/worktrees/foo', exitCode: 0, output: '' });

    const result = await worktreeRemove({ cwd: '/repo', worktreePath: '/repo/worktrees/foo' });

    expect(result).toStrictEqual({ exitCode: 0, output: '' });
  });

  it('ERROR: {exitCode: 1, output: "not a working tree"} => returns it, does not throw', async () => {
    const proxy = worktreeRemoveProxy();
    proxy.setupResult({
      worktreePath: '/repo/worktrees/foo',
      exitCode: 1,
      output: 'not a working tree',
    });

    const result = await worktreeRemove({ cwd: '/repo', worktreePath: '/repo/worktrees/foo' });

    expect(result).toStrictEqual({ exitCode: 1, output: 'not a working tree' });
  });

  describe('tolerant addressing', () => {
    it('VALID: {returnsMatchingWorktreePath, a predicate} => resolves for a worktree path the predicate accepts', async () => {
      const proxy = worktreeRemoveProxy();
      proxy.returnsMatchingWorktreePath({
        worktreePath: (value) => String(value).startsWith('/repo/worktrees/'),
        exitCode: 0,
        output: '',
      });

      const result = await worktreeRemove({
        cwd: '/repo',
        worktreePath: '/repo/worktrees/computed-at-runtime',
      });

      expect(result).toStrictEqual({ exitCode: 0, output: '' });
    });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the actual cwd', async () => {
      const proxy = worktreeRemoveProxy();
      proxy.setupResult({ worktreePath: '/repo/worktrees/foo', exitCode: 0, output: '' });

      await worktreeRemove({
        cwd: '/worktrees/computed-at-runtime',
        worktreePath: '/repo/worktrees/foo',
      });

      expect(proxy.getCallsFor({ worktreePath: '/repo/worktrees/foo' })).toStrictEqual([
        [
          {
            command: 'git',
            args: ['worktree', 'remove', '--force', '/repo/worktrees/foo'],
            cwd: '/worktrees/computed-at-runtime',
          },
        ],
      ]);
    });
  });
});
