import { packageBinManifestContract } from './package-bin-manifest-contract';
import { PackageBinManifestStub } from './package-bin-manifest.stub';

describe('packageBinManifestContract', () => {
  it('VALID: {bin map} => parses the map', () => {
    expect(packageBinManifestContract.parse(PackageBinManifestStub())).toStrictEqual({
      bin: { 'dungeonmaster-ward': './dist/bin/ward-entry.js' },
    });
  });

  it('VALID: {bin as one entry script} => parses the string', () => {
    expect(packageBinManifestContract.parse({ bin: './dist/bin/cli.js' })).toStrictEqual({
      bin: './dist/bin/cli.js',
    });
  });

  it('EMPTY: {manifest with no bin, other keys} => parses to an empty object', () => {
    expect(packageBinManifestContract.parse({ name: '@dungeonmaster/shared' })).toStrictEqual({});
  });

  it('INVALID: {bin: 3} => throws', () => {
    expect(() => packageBinManifestContract.parse({ bin: 3 })).toThrow(/Invalid input/u);
  });
});
