import { npmInstalledManifestContract } from './npm-installed-manifest-contract';
import { NpmInstalledManifestStub } from './npm-installed-manifest.stub';

describe('npmInstalledManifestContract', () => {
  it('VALID: {} => stub holds version 1.0.0', () => {
    expect(NpmInstalledManifestStub()).toStrictEqual({ version: '1.0.0' });
  });

  it('VALID: {name, version, main} => keeps every key', () => {
    const result = npmInstalledManifestContract.parse({
      name: 'zod',
      version: '3.23.8',
      main: 'index.js',
    });

    expect(result).toStrictEqual({ name: 'zod', version: '3.23.8', main: 'index.js' });
  });

  it('EMPTY: {no version} => parses without one', () => {
    expect(npmInstalledManifestContract.parse({ type: 'commonjs' })).toStrictEqual({
      type: 'commonjs',
    });
  });

  it('INVALID: {version: ""} => throws a validation error', () => {
    expect(() => npmInstalledManifestContract.parse({ version: '' })).toThrow(/Too small/u);
  });
});
