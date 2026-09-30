import { WorktreeEnsureQuestBranchResultStub } from './worktree-ensure-quest-branch-result.stub';
import { worktreeEnsureQuestBranchResultContract } from './worktree-ensure-quest-branch-result-contract';

describe('worktreeEnsureQuestBranchResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = WorktreeEnsureQuestBranchResultStub();

      expect(worktreeEnsureQuestBranchResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {attempted: wrong type} => throws', () => {
      expect(() =>
        worktreeEnsureQuestBranchResultContract.parse({
          ...WorktreeEnsureQuestBranchResultStub(),
          attempted: 'nope',
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
