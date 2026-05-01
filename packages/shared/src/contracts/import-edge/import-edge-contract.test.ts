import { importEdgeContract } from './import-edge-contract';
import { ContentTextStub } from '../content-text/content-text.stub';

describe('importEdgeContract', () => {
  describe('parse', () => {
    it('VALID: {consumerPackage, sourcePackage, barrel, importCount:1} => parses successfully', () => {
      const result = importEdgeContract.parse({
        consumerPackage: ContentTextStub({ value: 'web' }),
        sourcePackage: ContentTextStub({ value: 'shared' }),
        barrel: ContentTextStub({ value: 'contracts' }),
        importCount: 1,
      });

      expect(result).toStrictEqual({
        consumerPackage: 'web',
        sourcePackage: 'shared',
        barrel: 'contracts',
        importCount: 1,
      });
    });

    it('VALID: {barrel empty string for root import} => parses successfully', () => {
      const result = importEdgeContract.parse({
        consumerPackage: ContentTextStub({ value: 'server' }),
        sourcePackage: ContentTextStub({ value: 'shared' }),
        barrel: ContentTextStub({ value: '' }),
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
          consumerPackage: ContentTextStub({ value: 'web' }),
          sourcePackage: ContentTextStub({ value: 'shared' }),
          barrel: ContentTextStub({ value: 'contracts' }),
          importCount: 0,
        }),
      ).toThrow(/Number must be greater than or equal to 1/u);
    });

    it('INVALID: {importCount: negative} => throws min-1 validation error', () => {
      expect(() =>
        importEdgeContract.parse({
          consumerPackage: ContentTextStub({ value: 'web' }),
          sourcePackage: ContentTextStub({ value: 'shared' }),
          barrel: ContentTextStub({ value: 'contracts' }),
          importCount: -1,
        }),
      ).toThrow(/Number must be greater than or equal to 1/u);
    });
  });
});
