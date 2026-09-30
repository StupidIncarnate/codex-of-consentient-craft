import { importEdgeContract } from './import-edge-contract';
import { ImportEdgeStub } from './import-edge.stub';

describe('importEdgeContract', () => {
  describe('parse', () => {
    it('VALID: {consumerPackage, sourcePackage, barrel, importCount:1} => parses successfully', () => {
      const result = importEdgeContract.parse(ImportEdgeStub());

      expect(result).toStrictEqual({
        consumerPackage: 'web',
        sourcePackage: 'shared',
        barrel: 'contracts',
        importCount: 1,
      });
    });

    it('VALID: {barrel empty string for root import} => parses successfully', () => {
      const result = importEdgeContract.parse({
        consumerPackage: 'server',
        sourcePackage: 'shared',
        barrel: '',
        importCount: 5,
      });

      expect(result).toStrictEqual({
        consumerPackage: 'server',
        sourcePackage: 'shared',
        barrel: '',
        importCount: 5,
      });
    });

    it('INVALID: {importCount: 0} => throws min-1 validation error', () => {
      expect(() =>
        importEdgeContract.parse({
          consumerPackage: 'web',
          sourcePackage: 'shared',
          barrel: 'contracts',
          importCount: 0,
        }),
      ).toThrow(/expected number to be >=1/u);
    });

    it('INVALID: {importCount: negative} => throws min-1 validation error', () => {
      expect(() =>
        importEdgeContract.parse({
          consumerPackage: 'web',
          sourcePackage: 'shared',
          barrel: 'contracts',
          importCount: -1,
        }),
      ).toThrow(/expected number to be >=1/u);
    });
  });
});
