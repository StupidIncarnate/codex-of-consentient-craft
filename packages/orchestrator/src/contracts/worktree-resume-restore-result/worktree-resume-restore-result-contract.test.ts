import { WorktreeResumeRestoreResultStub } from './worktree-resume-restore-result.stub';
import { worktreeResumeRestoreResultContract } from './worktree-resume-restore-result-contract';

describe('worktreeResumeRestoreResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = WorktreeResumeRestoreResultStub();

      expect(worktreeResumeRestoreResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {restored: wrong type} => throws', () => {
      expect(() =>
        worktreeResumeRestoreResultContract.parse({
          ...WorktreeResumeRestoreResultStub(),
          restored: 'nope',
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
