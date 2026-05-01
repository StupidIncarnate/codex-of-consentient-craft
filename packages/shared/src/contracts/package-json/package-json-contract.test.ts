import { packageJsonContract } from './package-json-contract';
import { PackageJsonStub } from './package-json.stub';

describe('packageJsonContract', () => {
  describe('valid inputs', () => {
    it('VALID: empty stub => parses successfully with no fields', () => {
      const pkg = PackageJsonStub();

      const result = packageJsonContract.parse(pkg);

      expect(result).toStrictEqual({});
    });

    it('VALID: name only => parses successfully', () => {
      const pkg = PackageJsonStub({ name: '@dungeonmaster/web' });

      const result = packageJsonContract.parse(pkg);

      expect(result).toStrictEqual({ name: '@dungeonmaster/web' });
    });

    it('VALID: bin as record => parses successfully', () => {
      const pkg = PackageJsonStub({ bin: { dungeonmaster: './dist/bin.js' } });

      const result = packageJsonContract.parse(pkg);

      expect(result).toStrictEqual({ bin: { dungeonmaster: './dist/bin.js' } });
    });

    it('VALID: bin as string => parses successfully', () => {
      const pkg = PackageJsonStub({ bin: './dist/bin.js' });

      const result = packageJsonContract.parse(pkg);

      expect(result).toStrictEqual({ bin: './dist/bin.js' });
    });

    it('VALID: dependencies record => parses successfully', () => {
      const pkg = PackageJsonStub({ dependencies: { react: '18.0.0' } });

      const result = packageJsonContract.parse(pkg);

      expect(result).toStrictEqual({ dependencies: { react: '18.0.0' } });
    });

    it('VALID: exports record => parses successfully', () => {
      const pkg = PackageJsonStub({ exports: { '.': './dist/index.js' } });

      const result = packageJsonContract.parse(pkg);

      expect(result).toStrictEqual({ exports: { '.': './dist/index.js' } });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: non-object input => throws validation error', () => {
      expect(() => {
        packageJsonContract.parse('not-an-object');
      }).toThrow(/Expected object/u);
    });
  });
});
