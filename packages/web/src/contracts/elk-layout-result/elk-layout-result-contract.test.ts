import { ElkLayoutResultStub } from './elk-layout-result.stub';
import { elkLayoutResultContract } from './elk-layout-result-contract';

describe('elkLayoutResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = ElkLayoutResultStub();

      expect(elkLayoutResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {positions: wrong type} => throws', () => {
      expect(() =>
        elkLayoutResultContract.parse({ ...ElkLayoutResultStub(), positions: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
