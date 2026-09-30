import { ArrayEntryLineParseLayerResultStub } from './array-entry-line-parse-layer-result.stub';
import { arrayEntryLineParseLayerResultContract } from './array-entry-line-parse-layer-result-contract';

describe('arrayEntryLineParseLayerResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = ArrayEntryLineParseLayerResultStub();

      expect(arrayEntryLineParseLayerResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {entries: wrong type} => throws', () => {
      expect(() =>
        arrayEntryLineParseLayerResultContract.parse({
          ...ArrayEntryLineParseLayerResultStub(),
          entries: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
