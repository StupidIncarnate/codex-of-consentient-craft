import { locationsWorktreePathFindBroker } from './locations-worktree-path-find-broker';
import { locationsWorktreePathFindBrokerProxy } from './locations-worktree-path-find-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import { FileNameStub } from '../../../contracts/file-name/file-name.stub';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('locationsWorktreePathFindBroker', () => {
  describe('worktree path resolution', () => {
    it('VALID: {repoRoot: "/repo", worktreeDirName: "add-auth-7bc217a1"} => returns /repo/worktrees/add-auth-7bc217a1', () => {
      const proxy = locationsWorktreePathFindBrokerProxy();

      proxy.setupWorktreePath({
        worktreePath: FilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' }),
      });

      const result = locationsWorktreePathFindBroker({
        repoRoot: AbsoluteFilePathStub({ value: '/repo' }),
        worktreeDirName: FileNameStub({ value: 'add-auth-7bc217a1' }),
      });

      expect(result).toBe(AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' }));
    });

    it('VALID: {repoRoot: "/home/user/repo", worktreeDirName: "quest-git-lifecycle-baseref-branching-7bc217a1"} => resolves nested repo root', () => {
      const proxy = locationsWorktreePathFindBrokerProxy();

      proxy.setupWorktreePath({
        worktreePath: FilePathStub({
          value: '/home/user/repo/worktrees/quest-git-lifecycle-baseref-branching-7bc217a1',
        }),
      });

      const result = locationsWorktreePathFindBroker({
        repoRoot: AbsoluteFilePathStub({ value: '/home/user/repo' }),
        worktreeDirName: FileNameStub({
          value: 'quest-git-lifecycle-baseref-branching-7bc217a1',
        }),
      });

      expect(result).toBe(
        AbsoluteFilePathStub({
          value: '/home/user/repo/worktrees/quest-git-lifecycle-baseref-branching-7bc217a1',
        }),
      );
    });
  });
});
