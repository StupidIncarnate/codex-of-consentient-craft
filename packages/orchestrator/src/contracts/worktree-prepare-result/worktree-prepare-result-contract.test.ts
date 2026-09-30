import { WorktreePrepareResultStub } from './worktree-prepare-result.stub';
import { worktreePrepareResultContract } from './worktree-prepare-result-contract';

describe('worktreePrepareResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = WorktreePrepareResultStub();

      expect(worktreePrepareResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {baseRef: wrong type} => throws', () => {
      expect(() =>
        worktreePrepareResultContract.parse({ ...WorktreePrepareResultStub(), baseRef: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
