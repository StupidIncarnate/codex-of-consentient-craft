import { packageNameContract } from './package-name-contract';
import { PackageNameStub as _PackageNameStub } from './package-name.stub';

describe('packageNameContract', () => {
  describe('valid package names', () => {
    it('VALID: {name: "@dungeonmaster/shared"} => parses successfully', () => {
      const result = packageNameContract.parse('@dungeonmaster/shared');

      expect(result).toBe('@dungeonmaster/shared');
    });

    it('VALID: {name: "lodash"} => parses successfully', () => {
      const result = packageNameContract.parse('lodash');

      expect(result).toBe('lodash');
    });

    it('VALID: {name: "@scope/package-name"} => parses successfully', () => {
      const result = packageNameContract.parse('@scope/package-name');

      expect(result).toBe('@scope/package-name');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {name: ""} => throws ZodError', () => {
      expect(() => {
        return packageNameContract.parse('');
      }).toThrow('expected string to have >=1 characters');
    });

    it('INVALID: {name: 123} => throws ZodError', () => {
      expect(() => {
        return packageNameContract.parse(123);
      }).toThrow('expected string');
    });

    it('INVALID: {name: null} => throws ZodError', () => {
      expect(() => {
        return packageNameContract.parse(null);
      }).toThrow('expected string');
    });

    it('INVALID: {name: undefined} => throws ZodError', () => {
      expect(() => {
        return packageNameContract.parse(undefined);
      }).toThrow('received undefined');
    });
  });
});
