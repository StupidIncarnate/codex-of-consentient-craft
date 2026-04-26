import { packageJsonContract } from './package-json-contract';
import { PackageJsonStub } from './package-json.stub';

describe('packageJsonContract', () => {
  describe('valid inputs', () => {
    it('VALID: {devDependencies: {typescript: "^5.8.3"}} => parses successfully', () => {
      const result = packageJsonContract.parse({ devDependencies: { typescript: '^5.8.3' } });

      expect(result.devDependencies).toStrictEqual({ typescript: '^5.8.3' });
    });

    it('VALID: {} => parses object without devDependencies', () => {
      const result = packageJsonContract.parse({});

      expect(result.devDependencies).toBe(undefined);
    });

    it('VALID: {name, devDependencies} => passes through extra fields', () => {
      const result = packageJsonContract.parse({ name: 'my-pkg', devDependencies: {} });

      expect(result.devDependencies).toStrictEqual({});
    });
  });

  describe('PackageJsonStub', () => {
    it('VALID: {} => returns default stub with devDependencies', () => {
      const result = PackageJsonStub();

      expect(result.devDependencies).toStrictEqual({ typescript: '^5.8.3' });
    });
  });
});
