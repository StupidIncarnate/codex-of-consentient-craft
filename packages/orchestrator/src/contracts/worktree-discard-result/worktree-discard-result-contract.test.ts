import { WorktreeDiscardResultStub } from './worktree-discard-result.stub';
import { worktreeDiscardResultContract } from './worktree-discard-result-contract';

describe('worktreeDiscardResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = WorktreeDiscardResultStub();

      expect(worktreeDiscardResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {discarded: wrong type} => throws', () => {
      expect(() =>
        worktreeDiscardResultContract.parse({ ...WorktreeDiscardResultStub(), discarded: 'nope' }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
