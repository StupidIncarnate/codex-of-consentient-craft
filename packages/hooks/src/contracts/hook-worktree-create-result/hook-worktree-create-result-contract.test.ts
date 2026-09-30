import { HookWorktreeCreateResultStub } from './hook-worktree-create-result.stub';
import { hookWorktreeCreateResultContract } from './hook-worktree-create-result-contract';

describe('hookWorktreeCreateResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = HookWorktreeCreateResultStub();

      expect(hookWorktreeCreateResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {stderr: wrong type} => throws', () => {
      expect(() =>
        hookWorktreeCreateResultContract.parse({ ...HookWorktreeCreateResultStub(), stderr: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
