import { adapterShapeClassifyTransformer } from './adapter-shape-classify-transformer';
import { AdapterAnalysisStub } from '../../contracts/adapter-analysis/adapter-analysis.stub';
import { GatewayExportStub } from '../../contracts/gateway-export/gateway-export.stub';
import { OutsideCallStub } from '../../contracts/outside-call/outside-call.stub';

describe('adapterShapeClassifyTransformer', () => {
  it('VALID: {one outside call, a gateway match, no reasons} => pass-through', () => {
    const result = adapterShapeClassifyTransformer({
      analysis: AdapterAnalysisStub(),
      gateway: [GatewayExportStub()],
    });

    expect(result).toStrictEqual({ shape: 'pass-through', reasons: [] });
  });

  it('VALID: {one outside call, no gateway match} => logic, no-gateway-export', () => {
    const result = adapterShapeClassifyTransformer({
      analysis: AdapterAnalysisStub(),
      gateway: [],
    });

    expect(result).toStrictEqual({ shape: 'logic', reasons: ['no-gateway-export'] });
  });

  it('VALID: {two outside calls} => logic, multiple-outside-calls', () => {
    const result = adapterShapeClassifyTransformer({
      analysis: AdapterAnalysisStub({
        outsideCalls: [OutsideCallStub(), OutsideCallStub({ name: 'writeFile' })],
      }),
      gateway: [GatewayExportStub()],
    });

    expect(result).toStrictEqual({ shape: 'logic', reasons: ['multiple-outside-calls'] });
  });

  it('EMPTY: {no outside call} => logic, no-outside-call only', () => {
    const result = adapterShapeClassifyTransformer({
      analysis: AdapterAnalysisStub({ outsideCalls: [] }),
      gateway: [],
    });

    expect(result).toStrictEqual({ shape: 'logic', reasons: ['no-outside-call'] });
  });

  it('VALID: {structural reasons from the analysis} => kept beside the counted ones, once each', () => {
    const result = adapterShapeClassifyTransformer({
      analysis: AdapterAnalysisStub({ reasons: ['try-catch', 'branching', 'try-catch'] }),
      gateway: [],
    });

    expect(result).toStrictEqual({
      shape: 'logic',
      reasons: ['no-gateway-export', 'try-catch', 'branching'],
    });
  });
});
