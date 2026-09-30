import { ResolveCallerRepoRootLayerResultStub } from './resolve-caller-repo-root-layer-result.stub';
import { resolveCallerRepoRootLayerResultContract } from './resolve-caller-repo-root-layer-result-contract';

describe('resolveCallerRepoRootLayerResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = ResolveCallerRepoRootLayerResultStub();

      expect(resolveCallerRepoRootLayerResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {repoRoot: wrong type} => throws', () => {
      expect(() =>
        resolveCallerRepoRootLayerResultContract.parse({
          ...ResolveCallerRepoRootLayerResultStub(),
          repoRoot: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
