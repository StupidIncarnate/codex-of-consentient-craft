import { testGuildPackageJsonContract } from './test-guild-package-json-contract';
import { TestGuildPackageJsonStub } from './test-guild-package-json.stub';

describe('testGuildPackageJsonContract', () => {
  describe('valid inputs', () => {
    it('VALID: {name, version, scripts} => parses successfully', () => {
      const result = testGuildPackageJsonContract.parse({
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
      const result = TestGuildPackageJsonStub();

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
      const result = TestGuildPackageJsonStub({
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
        testGuildPackageJsonContract.parse({
          version: '1.0.0',
          scripts: {},
        }),
      ).toThrow('name');
    });

    it('INVALID: missing version => throws validation error', () => {
      expect(() =>
        testGuildPackageJsonContract.parse({
          name: 'test',
          scripts: {},
        }),
      ).toThrow('version');
    });

    it('INVALID: missing scripts => throws validation error', () => {
      expect(() =>
        testGuildPackageJsonContract.parse({
          name: 'test',
          version: '1.0.0',
        }),
      ).toThrow('scripts');
    });
  });
});
