import { FolderConstraintsInitResultStub } from './folder-constraints-init-result.stub';
import { folderConstraintsInitResultContract } from './folder-constraints-init-result-contract';

describe('folderConstraintsInitResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = FolderConstraintsInitResultStub();

      expect(folderConstraintsInitResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {folderConstraints: wrong type} => throws', () => {
      expect(() =>
        folderConstraintsInitResultContract.parse({
          ...FolderConstraintsInitResultStub(),
          folderConstraints: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
