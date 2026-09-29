import { censusPackageContract } from './census-package-contract';
import { CensusPackageStub } from './census-package.stub';

describe('censusPackageContract', () => {
  it('VALID: {defaults} => parses the default package', () => {
    const result = CensusPackageStub();

    expect(result).toStrictEqual({ name: '@acme/example', dir: 'packages/example' });
  });

  it('VALID: {a gateway package} => keeps the nested dir', () => {
    const result = CensusPackageStub({
      name: '@acme/node',
      dir: 'packages/@gateway/node',
    });

    expect(result).toStrictEqual({ name: '@acme/node', dir: 'packages/@gateway/node' });
  });

  it('INVALID: {name: ""} => throws a too-small error', () => {
    expect(() => CensusPackageStub({ name: '' })).toThrow(/^[\s\S]*>=1 characters[\s\S]*$/u);
  });

  it('VALID: {stub output} => parses again to the same value', () => {
    const stubbed = CensusPackageStub();

    const result = censusPackageContract.parse(stubbed);

    expect(result).toStrictEqual(stubbed);
  });
});
