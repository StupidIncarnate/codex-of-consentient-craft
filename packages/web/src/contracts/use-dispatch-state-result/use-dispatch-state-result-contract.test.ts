import { UseDispatchStateResultStub } from './use-dispatch-state-result.stub';
import { useDispatchStateResultContract } from './use-dispatch-state-result-contract';

describe('useDispatchStateResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = UseDispatchStateResultStub();

      expect(useDispatchStateResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {state: wrong type} => throws', () => {
      expect(() =>
        useDispatchStateResultContract.parse({ ...UseDispatchStateResultStub(), state: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
