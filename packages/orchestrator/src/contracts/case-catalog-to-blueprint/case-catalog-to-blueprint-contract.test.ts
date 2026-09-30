import { CaseCatalogToBlueprintStub } from './case-catalog-to-blueprint.stub';
import { caseCatalogToBlueprintContract } from './case-catalog-to-blueprint-contract';

describe('caseCatalogToBlueprintContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = CaseCatalogToBlueprintStub();

      expect(caseCatalogToBlueprintContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {blueprint: wrong type} => throws', () => {
      expect(() =>
        caseCatalogToBlueprintContract.parse({ ...CaseCatalogToBlueprintStub(), blueprint: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
