import { KebabCaseVariantsStub } from './kebab-case-variants.stub';
import { kebabCaseVariantsContract } from './kebab-case-variants-contract';

describe('kebabCaseVariantsContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = KebabCaseVariantsStub();

      expect(kebabCaseVariantsContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {camel: wrong type} => throws', () => {
      expect(() =>
        kebabCaseVariantsContract.parse({ ...KebabCaseVariantsStub(), camel: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
