import { GlobDiscoverFilesResultStub } from './glob-discover-files-result.stub';
import { globDiscoverFilesResultContract } from './glob-discover-files-result-contract';

describe('globDiscoverFilesResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = GlobDiscoverFilesResultStub();

      expect(globDiscoverFilesResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {discoveredCount: wrong type} => throws', () => {
      expect(() =>
        globDiscoverFilesResultContract.parse({
          ...GlobDiscoverFilesResultStub(),
          discoveredCount: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
