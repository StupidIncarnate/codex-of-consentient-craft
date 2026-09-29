import { adapterAnalysisContract } from './adapter-analysis-contract';
import { AdapterAnalysisStub } from './adapter-analysis.stub';

describe('adapterAnalysisContract', () => {
  it('VALID: {defaults} => one outside call and no reasons', () => {
    const result = AdapterAnalysisStub();

    expect(result).toStrictEqual({
      outsideCalls: [{ module: 'fs/promises', name: 'readFile' }],
      reasons: [],
    });
  });

  it('VALID: {reasons: ["try-catch"]} => keeps the reason', () => {
    const result = AdapterAnalysisStub({ reasons: ['try-catch'] });

    expect(result.reasons).toStrictEqual(['try-catch']);
  });

  it('INVALID: {reasons: ["other"]} => throws an invalid-option error', () => {
    expect(() => AdapterAnalysisStub({ reasons: ['other'] })).toThrow(
      /^[\s\S]*Invalid option[\s\S]*$/u,
    );
  });

  it('VALID: {stub output} => parses again to the same value', () => {
    const stubbed = AdapterAnalysisStub();

    const result = adapterAnalysisContract.parse(stubbed);

    expect(result).toStrictEqual(stubbed);
  });
});
