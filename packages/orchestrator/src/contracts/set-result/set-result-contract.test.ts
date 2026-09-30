import { SetResultStub } from './set-result.stub';
import { setResultContract } from './set-result-contract';

describe('setResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = SetResultStub();

      expect(setResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {success: wrong type} => throws', () => {
      expect(() => setResultContract.parse({ ...SetResultStub(), success: 123 })).toThrow(
        /expected|invalid/iu,
      );
    });
  });
});
