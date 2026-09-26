import { worktreeRemove } from './git-worktree-remove';
import { gitWorktreeRemoveProxy } from './git-worktree-remove.proxy';

describe('worktreeRemove()', () => {
  it('VALID: {worktreePath} => runs git worktree remove --force <worktreePath>', async () => {
    const proxy = gitWorktreeRemoveProxy();
    proxy.setupResult({ worktreePath: '/repo/worktrees/foo', exitCode: 0, output: '' });

    const result = await worktreeRemove({ cwd: '/repo', worktreePath: '/repo/worktrees/foo' });

    expect(result).toStrictEqual({ exitCode: 0, output: '' });
  });

  it('ERROR: {exitCode: 1, output: "not a working tree"} => returns it, does not throw', async () => {
    const proxy = gitWorktreeRemoveProxy();
    proxy.setupResult({
      worktreePath: '/repo/worktrees/foo',
      exitCode: 1,
      output: 'not a working tree',
    });

    const result = await worktreeRemove({ cwd: '/repo', worktreePath: '/repo/worktrees/foo' });

    expect(result).toStrictEqual({ exitCode: 1, output: 'not a working tree' });
  });
});
