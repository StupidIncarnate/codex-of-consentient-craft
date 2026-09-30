import { ImportsInFolderTypeFindLayerResultStub } from './imports-in-folder-type-find-layer-result.stub';
import { importsInFolderTypeFindLayerResultContract } from './imports-in-folder-type-find-layer-result-contract';

describe('importsInFolderTypeFindLayerResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = ImportsInFolderTypeFindLayerResultStub();

      expect(importsInFolderTypeFindLayerResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {entries: wrong type} => throws', () => {
      expect(() =>
        importsInFolderTypeFindLayerResultContract.parse({
          ...ImportsInFolderTypeFindLayerResultStub(),
          entries: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
