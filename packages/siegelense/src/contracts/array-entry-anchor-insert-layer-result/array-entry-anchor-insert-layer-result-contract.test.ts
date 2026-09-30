import { ArrayEntryAnchorInsertLayerResultStub } from './array-entry-anchor-insert-layer-result.stub';
import { arrayEntryAnchorInsertLayerResultContract } from './array-entry-anchor-insert-layer-result-contract';

describe('arrayEntryAnchorInsertLayerResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = ArrayEntryAnchorInsertLayerResultStub();

      expect(arrayEntryAnchorInsertLayerResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {content: wrong type} => throws', () => {
      expect(() =>
        arrayEntryAnchorInsertLayerResultContract.parse({
          ...ArrayEntryAnchorInsertLayerResultStub(),
          content: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
