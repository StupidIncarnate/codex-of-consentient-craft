import { CallerRepoRootResolveResultStub } from './caller-repo-root-resolve-result.stub';
import { callerRepoRootResolveResultContract } from './caller-repo-root-resolve-result-contract';

describe('callerRepoRootResolveResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = CallerRepoRootResolveResultStub();

      expect(callerRepoRootResolveResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {repoRoot: wrong type} => throws', () => {
      expect(() =>
        callerRepoRootResolveResultContract.parse({
          ...CallerRepoRootResolveResultStub(),
          repoRoot: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
