import { isNpmPackageGuard } from './is-npm-package-guard';

describe('isNpmPackageGuard', () => {
  describe('valid npm packages', () => {
    it('VALID: {importSource: "axios"} => returns true', () => {
      expect(isNpmPackageGuard({ importSource: 'axios' })).toBe(true);
    });

    it('VALID: {importSource: "lodash"} => returns true', () => {
      expect(isNpmPackageGuard({ importSource: 'lodash' })).toBe(true);
    });

    it('VALID: {importSource: "@types/node"} => returns true', () => {
      expect(isNpmPackageGuard({ importSource: '@types/node' })).toBe(true);
    });

    it('VALID: {importSource: "@babel/core"} => returns true', () => {
      expect(isNpmPackageGuard({ importSource: '@babel/core' })).toBe(true);
    });

    it('VALID: {importSource: "node:fs"} => returns true', () => {
      expect(isNpmPackageGuard({ importSource: 'node:fs' })).toBe(true);
    });

    it('VALID: {importSource: "node:path"} => returns true', () => {
      expect(isNpmPackageGuard({ importSource: 'node:path' })).toBe(true);
    });

    it('VALID: {importSource: "lodash/get"} => returns true', () => {
      expect(isNpmPackageGuard({ importSource: 'lodash/get' })).toBe(true);
    });
  });

  describe('invalid - workspace packages', () => {
    it('INVALID: {importSource: "@questmaestro/shared"} => returns false', () => {
      expect(isNpmPackageGuard({ importSource: '@questmaestro/shared' })).toBe(false);
    });

    it('INVALID: {importSource: "@questmaestro/testing"} => returns false', () => {
      expect(isNpmPackageGuard({ importSource: '@questmaestro/testing' })).toBe(false);
    });

    it('INVALID: {importSource: "@questmaestro/shared/contracts"} => returns false', () => {
      expect(isNpmPackageGuard({ importSource: '@questmaestro/shared/contracts' })).toBe(false);
    });
  });

  describe('invalid - relative paths', () => {
    it('INVALID: {importSource: "./foo"} => returns false', () => {
      expect(isNpmPackageGuard({ importSource: './foo' })).toBe(false);
    });

    it('INVALID: {importSource: "../bar"} => returns false', () => {
      expect(isNpmPackageGuard({ importSource: '../bar' })).toBe(false);
    });

    it('INVALID: {importSource: "../../baz"} => returns false', () => {
      expect(isNpmPackageGuard({ importSource: '../../baz' })).toBe(false);
    });

    it('INVALID: {importSource: "./user-broker"} => returns false', () => {
      expect(isNpmPackageGuard({ importSource: './user-broker' })).toBe(false);
    });
  });

  describe('invalid - absolute paths', () => {
    it('INVALID: {importSource: "/absolute/path"} => returns false', () => {
      expect(isNpmPackageGuard({ importSource: '/absolute/path' })).toBe(false);
    });

    it('INVALID: {importSource: "/usr/lib/module"} => returns false', () => {
      expect(isNpmPackageGuard({ importSource: '/usr/lib/module' })).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {importSource: ""} => returns true', () => {
      expect(isNpmPackageGuard({ importSource: '' })).toBe(true);
    });
  });
});
