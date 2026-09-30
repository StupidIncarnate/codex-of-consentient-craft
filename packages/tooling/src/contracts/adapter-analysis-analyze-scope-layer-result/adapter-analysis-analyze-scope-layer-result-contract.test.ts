import { AdapterAnalysisAnalyzeScopeLayerResultStub } from './adapter-analysis-analyze-scope-layer-result.stub';
import { adapterAnalysisAnalyzeScopeLayerResultContract } from './adapter-analysis-analyze-scope-layer-result-contract';

describe('adapterAnalysisAnalyzeScopeLayerResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = AdapterAnalysisAnalyzeScopeLayerResultStub();

      expect(adapterAnalysisAnalyzeScopeLayerResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {bindings: wrong type} => throws', () => {
      expect(() =>
        adapterAnalysisAnalyzeScopeLayerResultContract.parse({
          ...AdapterAnalysisAnalyzeScopeLayerResultStub(),
          bindings: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
