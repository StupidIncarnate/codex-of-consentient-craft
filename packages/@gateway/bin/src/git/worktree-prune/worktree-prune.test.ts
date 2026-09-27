import { worktreePrune } from './worktree-prune';
import { worktreePruneProxy } from './worktree-prune.proxy';

describe('worktreePrune()', () => {
  it('VALID: {exitCode: 0} => runs git worktree prune', async () => {
    const proxy = worktreePruneProxy();
    proxy.setupResult({ exitCode: 0, output: '' });

    const result = await worktreePrune({ cwd: '/repo' });

    expect(result).toStrictEqual({ exitCode: 0, output: '' });
  });

  describe('call inspection', () => {
    it('VALID: {a real call already made} => getCallsFor reads back the actual cwd', async () => {
      const proxy = worktreePruneProxy();
      proxy.setupResult({ exitCode: 0, output: '' });

      await worktreePrune({ cwd: '/worktrees/computed-at-runtime' });

      expect(proxy.getCallsFor()).toStrictEqual([
        [{ command: 'git', args: ['worktree', 'prune'], cwd: '/worktrees/computed-at-runtime' }],
      ]);
    });
  });
});
