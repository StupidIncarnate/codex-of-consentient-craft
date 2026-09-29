import { sourceFactsContract } from './source-facts-contract';
import { SourceFactsStub } from './source-facts.stub';

describe('sourceFactsContract', () => {
  it('EMPTY: {defaults} => parses a file that imports and exports nothing', () => {
    const result = SourceFactsStub();

    expect(result).toStrictEqual({
      imports: [],
      reExports: [],
      exportNames: [],
      catchAllSites: [],
    });
  });

  it('VALID: {a star re-export} => keeps the flag and an empty name list', () => {
    const result = SourceFactsStub({
      reExports: [{ specifier: './a', names: [], isStar: true }],
    });

    expect(result.reExports).toStrictEqual([{ specifier: './a', names: [], isStar: true }]);
  });

  it('INVALID: {imports: [{}]} => throws a required-field error', () => {
    expect(() => SourceFactsStub({ imports: [{}] })).toThrow(/^[\s\S]*expected string[\s\S]*$/iu);
  });

  it('VALID: {stub output} => parses again to the same value', () => {
    const stubbed = SourceFactsStub();

    const result = sourceFactsContract.parse(stubbed);

    expect(result).toStrictEqual(stubbed);
  });
});
