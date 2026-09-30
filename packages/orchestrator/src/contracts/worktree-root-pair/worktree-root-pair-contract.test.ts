import { WorktreeRootPairStub } from './worktree-root-pair.stub';
import { worktreeRootPairContract } from './worktree-root-pair-contract';

describe('worktreeRootPairContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = WorktreeRootPairStub();

      expect(worktreeRootPairContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: wrong type} => throws', () => {
      expect(() => worktreeRootPairContract.parse(123)).toThrow(/expected|invalid/iu);
    });
  });
});
