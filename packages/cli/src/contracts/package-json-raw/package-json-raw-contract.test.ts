import { packageJsonRawContract } from './package-json-raw-contract';
import { PackageJsonRawStub } from './package-json-raw.stub';

describe('packageJsonRawContract', () => {
  describe('valid input', () => {
    it('VALID: {name, version} => parses to matching record', () => {
      const result = packageJsonRawContract.parse(
        PackageJsonRawStub({ name: 'x', version: '1.0.0' }),
      );

      expect(result).toStrictEqual({ name: 'x', version: '1.0.0' });
    });

    it('VALID: {keys out of alphabetical order} => preserves insertion order in JSON output', () => {
      const result = packageJsonRawContract.parse({
        name: 'x',
        license: 'MIT',
        devDependencies: {},
      });

      expect(JSON.stringify(result)).toBe('{"name":"x","license":"MIT","devDependencies":{}}');
    });

    it('EMPTY: {} => returns empty record', () => {
      expect(packageJsonRawContract.parse({})).toStrictEqual({});
    });
  });

  describe('invalid input', () => {
    it('INVALID: {non-object string} => throws', () => {
      expect(() => packageJsonRawContract.parse('nope' as never)).toThrow(
        /Expected object, received string/u,
      );
    });
  });
});
