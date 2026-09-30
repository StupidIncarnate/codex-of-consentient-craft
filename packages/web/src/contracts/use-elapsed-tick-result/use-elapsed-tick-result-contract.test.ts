import { UseElapsedTickResultStub } from './use-elapsed-tick-result.stub';
import { useElapsedTickResultContract } from './use-elapsed-tick-result-contract';

describe('useElapsedTickResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = UseElapsedTickResultStub();

      expect(useElapsedTickResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {now: wrong type} => throws', () => {
      expect(() =>
        useElapsedTickResultContract.parse({ ...UseElapsedTickResultStub(), now: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
