import { packageJsonContract } from './package-json-contract';
import { PackageJsonStub } from './package-json.stub';

describe('packageJsonContract', () => {
  describe('valid inputs', () => {
    it('VALID: {name and workspaces} => parses successfully', () => {
      const result = packageJsonContract.parse(PackageJsonStub());

      expect(result).toStrictEqual({
        name: 'example-package',
        workspaces: ['packages/*'],
      });
    });

    it('VALID: {empty object} => parses with no fields', () => {
      const result = packageJsonContract.parse({});

      expect(result).toStrictEqual({});
    });

    it('VALID: {extra fields} => parses with passthrough', () => {
      const result = packageJsonContract.parse({
        name: 'pkg',
        version: '1.0.0',
      });

      expect(result).toStrictEqual({
        name: 'pkg',
        version: '1.0.0',
      });
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {workspaces: "string"} => throws validation error', () => {
      expect(() =>
        packageJsonContract.parse({
          workspaces: 'packages/*',
        }),
      ).toThrow(/Expected array/u);
    });

    it('INVALID: {name: 42} => throws validation error', () => {
      expect(() =>
        packageJsonContract.parse({
          name: 42,
        }),
      ).toThrow(/Expected string/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid package json', () => {
      const result = PackageJsonStub();

      expect(result).toStrictEqual({
        name: 'example-package',
        workspaces: ['packages/*'],
      });
    });

    it('VALID: {override name} => uses override', () => {
      const result = PackageJsonStub({ name: 'custom' });

      expect(result).toStrictEqual({
        name: 'custom',
        workspaces: ['packages/*'],
      });
    });
  });
});
