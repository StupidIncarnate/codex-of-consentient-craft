import { worktreePrune } from './git-worktree-prune';
import { worktreePruneProxy } from './git-worktree-prune.proxy';

describe('worktreePrune()', () => {
  it('VALID: {exitCode: 0} => runs git worktree prune', async () => {
    const proxy = worktreePruneProxy();
    proxy.setupResult({ exitCode: 0, output: '' });

    const result = await worktreePrune({ cwd: '/repo' });

    expect(result).toStrictEqual({ exitCode: 0, output: '' });
  });
});
