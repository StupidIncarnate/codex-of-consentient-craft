import { ContractUsesScanLayerStub } from './contract-uses-scan-layer.stub';
import { contractUsesScanLayerContract } from './contract-uses-scan-layer-contract';

describe('contractUsesScanLayerContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = ContractUsesScanLayerStub();

      expect(contractUsesScanLayerContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {parseSites: wrong type} => throws', () => {
      expect(() =>
        contractUsesScanLayerContract.parse({ ...ContractUsesScanLayerStub(), parseSites: 123 }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
