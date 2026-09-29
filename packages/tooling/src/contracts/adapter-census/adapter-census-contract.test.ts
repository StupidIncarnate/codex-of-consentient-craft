import { adapterCensusContract } from './adapter-census-contract';
import { AdapterCensusStub } from './adapter-census.stub';

describe('adapterCensusContract', () => {
  it('EMPTY: {defaults} => an empty census with zero totals', () => {
    const result = AdapterCensusStub();

    expect(result).toStrictEqual({
      scope: '@acme',
      packages: [],
      totals: {
        adapters: 0,
        passThrough: 0,
        logic: 0,
        productionCallers: 0,
        composingProxies: 0,
        catchAllProxies: 0,
      },
    });
  });

  it('VALID: {scope: null} => a root with no name parses', () => {
    const result = AdapterCensusStub({ scope: null });

    expect(result.scope).toBe(null);
  });

  it('INVALID: {scope: ""} => throws a too-small error', () => {
    expect(() => AdapterCensusStub({ scope: '' })).toThrow(/^[\s\S]*>=1 characters[\s\S]*$/u);
  });

  it('VALID: {stub output} => parses again to the same value', () => {
    const stubbed = AdapterCensusStub();

    const result = adapterCensusContract.parse(stubbed);

    expect(result).toStrictEqual(stubbed);
  });
});
