import { packageCensusContract } from './package-census-contract';
import { PackageCensusStub } from './package-census.stub';

describe('packageCensusContract', () => {
  it('VALID: {defaults} => one package with one adapter', () => {
    const result = PackageCensusStub();

    expect(result.adapters.map((adapter) => adapter.file)).toStrictEqual([
      'packages/example/src/adapters/fs/read-file/fs-read-file-adapter.ts',
    ]);
  });

  it('EMPTY: {adapters: []} => a package with no adapters parses', () => {
    const result = PackageCensusStub({ adapters: [] });

    expect(result).toStrictEqual({ name: '@acme/example', dir: 'packages/example', adapters: [] });
  });

  it('INVALID: {adapters: [{}]} => throws a required-field error', () => {
    expect(() => PackageCensusStub({ adapters: [{}] as never })).toThrow(
      /^[\s\S]*expected string[\s\S]*$/iu,
    );
  });

  it('VALID: {stub output} => parses again to the same value', () => {
    const stubbed = PackageCensusStub();

    const result = packageCensusContract.parse(stubbed);

    expect(result).toStrictEqual(stubbed);
  });
});
