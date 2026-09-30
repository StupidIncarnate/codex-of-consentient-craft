import { PruneInstanceReclaimResultStub } from './prune-instance-reclaim-result.stub';
import { pruneInstanceReclaimResultContract } from './prune-instance-reclaim-result-contract';

describe('pruneInstanceReclaimResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = PruneInstanceReclaimResultStub();

      expect(pruneInstanceReclaimResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {removal: wrong type} => throws', () => {
      expect(() =>
        pruneInstanceReclaimResultContract.parse({
          ...PruneInstanceReclaimResultStub(),
          removal: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
