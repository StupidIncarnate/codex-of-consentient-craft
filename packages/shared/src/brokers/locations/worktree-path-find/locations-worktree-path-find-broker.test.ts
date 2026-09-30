import { locationsWorktreePathFindBroker } from './locations-worktree-path-find-broker';
import { locationsWorktreePathFindBrokerProxy } from './locations-worktree-path-find-broker.proxy';

describe('locationsWorktreePathFindBroker', () => {
  describe('worktree path resolution', () => {
    it('VALID: {repoRoot: "/repo", worktreeDirName: "add-auth-7bc217a1"} => returns /repo/worktrees/add-auth-7bc217a1', () => {
      const proxy = locationsWorktreePathFindBrokerProxy();

      proxy.setupWorktreePath({
        repoRoot: '/repo',
        worktreeDirName: 'add-auth-7bc217a1',
        worktreePath: '/repo/worktrees/add-auth-7bc217a1',
      });

      const result = locationsWorktreePathFindBroker({
        repoRoot: '/repo',
        worktreeDirName: 'add-auth-7bc217a1',
      });

      expect(result).toBe('/repo/worktrees/add-auth-7bc217a1');
    });

    it('VALID: {repoRoot: "/home/user/repo", worktreeDirName: "quest-git-lifecycle-baseref-branching-7bc217a1"} => resolves nested repo root', () => {
      const proxy = locationsWorktreePathFindBrokerProxy();

      proxy.setupWorktreePath({
        repoRoot: '/home/user/repo',
        worktreeDirName: 'quest-git-lifecycle-baseref-branching-7bc217a1',
        worktreePath: '/home/user/repo/worktrees/quest-git-lifecycle-baseref-branching-7bc217a1',
      });

      const result = locationsWorktreePathFindBroker({
        repoRoot: '/home/user/repo',
        worktreeDirName: 'quest-git-lifecycle-baseref-branching-7bc217a1',
      });

      expect(result).toBe(
        '/home/user/repo/worktrees/quest-git-lifecycle-baseref-branching-7bc217a1',
      );
    });
  });
});
