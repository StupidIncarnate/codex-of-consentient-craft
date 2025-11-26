import { packageJsonContract } from './package-json-contract';
import { PackageJsonStub } from './package-json.stub';

describe('packageJsonContract', () => {
  describe('valid inputs', () => {
    it('VALID: {name, version, scripts} => parses successfully', () => {
      const result = packageJsonContract.parse({
        name: 'test-project',
        version: '1.0.0',
        scripts: {
          test: 'jest',
          lint: 'eslint',
        },
      });

      expect(result).toStrictEqual({
        name: 'test-project',
        version: '1.0.0',
        scripts: {
          test: 'jest',
          lint: 'eslint',
        },
      });
    });

    it('VALID: stub with defaults => creates valid instance', () => {
      const result = PackageJsonStub();

      expect(result).toStrictEqual({
        name: 'test-project',
        version: '1.0.0',
        scripts: {
          test: 'jest',
          lint: 'eslint',
          typecheck: 'tsc --noEmit',
        },
      });
    });

    it('VALID: with devDependencies => includes devDependencies', () => {
      const result = PackageJsonStub({
        devDependencies: {
          typescript: '^5.0.0',
          jest: '^29.0.0',
        },
      });

      expect(result.devDependencies).toStrictEqual({
        typescript: '^5.0.0',
        jest: '^29.0.0',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: missing name => throws validation error', () => {
      expect(() =>
        packageJsonContract.parse({
          version: '1.0.0',
          scripts: {},
        }),
      ).toThrow('name');
    });

    it('INVALID: missing version => throws validation error', () => {
      expect(() =>
        packageJsonContract.parse({
          name: 'test',
          scripts: {},
        }),
      ).toThrow('version');
    });

    it('INVALID: missing scripts => throws validation error', () => {
      expect(() =>
        packageJsonContract.parse({
          name: 'test',
          version: '1.0.0',
        }),
      ).toThrow('scripts');
    });
  });
});
