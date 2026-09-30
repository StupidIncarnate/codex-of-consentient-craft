import { ContractFileExportsReadLayerStub } from './contract-file-exports-read-layer.stub';
import { contractFileExportsReadLayerContract } from './contract-file-exports-read-layer-contract';

describe('contractFileExportsReadLayerContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = ContractFileExportsReadLayerStub();

      expect(contractFileExportsReadLayerContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {exportedConstNames: wrong type} => throws', () => {
      expect(() =>
        contractFileExportsReadLayerContract.parse({
          ...ContractFileExportsReadLayerStub(),
          exportedConstNames: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
