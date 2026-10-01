import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import { workPlanFileRootsTransformer } from './work-plan-file-roots-transformer';

describe('workPlanFileRootsTransformer', () => {
  describe('a quest with a worktree', () => {
    it('VALID: {worktreePath under <repo>/worktrees} => returns the worktree, then the repo root', () => {
      const { worktreePath } = QuestStub({
        worktreePath: '/home/testuser/repo/worktrees/add-auth-1918a5ee',
      });

      const result = workPlanFileRootsTransformer({ worktreePath });

      expect(result).toStrictEqual([
        '/home/testuser/repo/worktrees/add-auth-1918a5ee',
        '/home/testuser/repo',
      ]);
    });

    it('VALID: {worktreePath with a trailing slash} => the slash is dropped from both roots', () => {
      const { worktreePath } = QuestStub({
        worktreePath: '/home/testuser/repo/worktrees/add-auth-1918a5ee/',
      });

      const result = workPlanFileRootsTransformer({ worktreePath });

      expect(result).toStrictEqual([
        '/home/testuser/repo/worktrees/add-auth-1918a5ee',
        '/home/testuser/repo',
      ]);
    });

    it('EDGE: {repo root itself sits under a worktrees directory} => cuts at the LAST worktrees segment', () => {
      const { worktreePath } = QuestStub({
        worktreePath: '/home/testuser/worktrees/repo/worktrees/add-auth-1918a5ee',
      });

      const result = workPlanFileRootsTransformer({ worktreePath });

      expect(result).toStrictEqual([
        '/home/testuser/worktrees/repo/worktrees/add-auth-1918a5ee',
        '/home/testuser/worktrees/repo',
      ]);
    });

    it('EDGE: {worktreePath outside any worktrees directory} => returns only the worktree', () => {
      const { worktreePath } = QuestStub({ worktreePath: '/home/testuser/scratch/add-auth' });

      const result = workPlanFileRootsTransformer({ worktreePath });

      expect(result).toStrictEqual(['/home/testuser/scratch/add-auth']);
    });
  });

  describe('a quest with no worktree', () => {
    it('EMPTY: {worktreePath: undefined} => returns no roots', () => {
      const { worktreePath } = QuestStub();

      const result = workPlanFileRootsTransformer({ worktreePath });

      expect(result).toStrictEqual([]);
    });
  });
});
