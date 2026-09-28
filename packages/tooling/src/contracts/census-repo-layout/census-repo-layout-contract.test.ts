import { censusRepoLayoutContract } from './census-repo-layout-contract';
import { CensusRepoLayoutStub } from './census-repo-layout.stub';

describe('censusRepoLayoutContract', () => {
  it('VALID: {defaults} => the default scope with one package', () => {
    const result = CensusRepoLayoutStub();

    expect(result).toStrictEqual({
      scope: '@acme',
      packages: [{ name: '@acme/example', dir: 'packages/example' }],
    });
  });

  it('EMPTY: {scope: null, packages: []} => a repo with no name and no packages parses', () => {
    const result = CensusRepoLayoutStub({ scope: null, packages: [] });

    expect(result).toStrictEqual({ scope: null, packages: [] });
  });

  it('INVALID: {scope: ""} => throws a too-small error', () => {
    expect(() => CensusRepoLayoutStub({ scope: '' as never })).toThrow(
      /^[\s\S]*>=1 characters[\s\S]*$/u,
    );
  });

  it('VALID: {stub output} => parses again to the same value', () => {
    const stubbed = CensusRepoLayoutStub();

    const result = censusRepoLayoutContract.parse(stubbed);

    expect(result).toStrictEqual(stubbed);
  });
});
