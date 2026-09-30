import { ContractUsesScanLayerStub } from './contract-uses-scan-layer.stub';
import { contractUsesScanLayerContract } from './contract-uses-scan-layer-contract';

describe('contractUsesScanLayerContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = ContractUsesScanLayerStub();

      expect(contractUsesScanLayerContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('whole parse sites', () => {
    it('VALID: {wholeParseSites: one site} => keeps the target file and line', () => {
      const result = contractUsesScanLayerContract.parse({
        ...ContractUsesScanLayerStub(),
        wholeParseSites: [
          { targetFile: '/repo/a-contract.ts', site: { filePath: '/repo/b.ts', line: 3 } },
        ],
      });

      expect(result.wholeParseSites).toStrictEqual([
        { targetFile: '/repo/a-contract.ts', site: { filePath: '/repo/b.ts', line: 3 } },
      ]);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {parseSites: wrong type} => throws', () => {
      expect(() =>
        contractUsesScanLayerContract.parse({ ...ContractUsesScanLayerStub(), parseSites: 123 }),
      ).toThrow(/expected|invalid/iu);
    });

    it('INVALID: {wholeParseSites: wrong type} => throws', () => {
      expect(() =>
        contractUsesScanLayerContract.parse({
          ...ContractUsesScanLayerStub(),
          wholeParseSites: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
