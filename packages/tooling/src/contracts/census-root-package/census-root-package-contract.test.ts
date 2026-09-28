import { censusRootPackageContract } from './census-root-package-contract';
import { CensusRootPackageStub } from './census-root-package.stub';

describe('censusRootPackageContract', () => {
  it('VALID: {defaults} => the default name', () => {
    const result = CensusRootPackageStub();

    expect(result).toStrictEqual({ name: '@acme/app' });
  });

  it('VALID: {a full package.json} => only the name is kept', () => {
    const result = censusRootPackageContract.parse({
      name: '@acme/app',
      version: '1.0.0',
      workspaces: ['packages/*'],
    });

    expect(result).toStrictEqual({ name: '@acme/app' });
  });

  it('EMPTY: {no name} => parses with no name', () => {
    const result = censusRootPackageContract.parse({ version: '1.0.0' });

    expect(result).toStrictEqual({});
  });

  it('INVALID: {name: ""} => throws a too-small error', () => {
    expect(() => CensusRootPackageStub({ name: '' as never })).toThrow(
      /^[\s\S]*>=1 characters[\s\S]*$/u,
    );
  });
});
