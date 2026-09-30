import { ContractFileOwnersReadLayerStub } from './contract-file-owners-read-layer.stub';
import { contractFileOwnersReadLayerContract } from './contract-file-owners-read-layer-contract';

describe('contractFileOwnersReadLayerContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = ContractFileOwnersReadLayerStub();

      expect(contractFileOwnersReadLayerContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {owners: wrong type} => throws', () => {
      expect(() =>
        contractFileOwnersReadLayerContract.parse({
          ...ContractFileOwnersReadLayerStub(),
          owners: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
