import { relativeFilePathContract } from './relative-file-path-contract';

describe('relativeFilePathContract', () => {
  describe('valid relative paths', () => {
    it('VALID: {path: "./relative/path.ts"} => parses successfully', () => {
      const result = relativeFilePathContract.parse('./relative/path.ts');

      expect(result).toBe('./relative/path.ts');
    });

    it('VALID: {path: "../parent/path.ts"} => parses successfully', () => {
      const result = relativeFilePathContract.parse('../parent/path.ts');

      expect(result).toBe('../parent/path.ts');
    });

    it('VALID: {path: "./file.txt"} => parses successfully', () => {
      const result = relativeFilePathContract.parse('./file.txt');

      expect(result).toBe('./file.txt');
    });

    it('VALID: {path: "../../grandparent/file.js"} => parses successfully', () => {
      const result = relativeFilePathContract.parse('../../grandparent/file.js');

      expect(result).toBe('../../grandparent/file.js');
    });
  });

  describe('invalid absolute paths', () => {
    it('INVALID: {path: "/absolute/path.ts"} => throws validation error', () => {
      expect(() => {
        return relativeFilePathContract.parse('/absolute/path.ts');
      }).toThrow('Path must be relative');
    });

    it('INVALID: {path: "C:\\\\Windows\\\\path.txt"} => throws validation error', () => {
      expect(() => {
        return relativeFilePathContract.parse('C:\\Windows\\path.txt');
      }).toThrow('Path must be relative');
    });
  });

  describe('invalid npm module names', () => {
    it('INVALID: {path: "lodash"} => throws validation error', () => {
      expect(() => {
        return relativeFilePathContract.parse('lodash');
      }).toThrow('Path must be relative');
    });

    it('INVALID: {path: "@react/core"} => throws validation error', () => {
      expect(() => {
        return relativeFilePathContract.parse('@react/core');
      }).toThrow('Path must be relative');
    });

    it('INVALID: {path: "relative/path.ts"} => throws validation error', () => {
      expect(() => {
        return relativeFilePathContract.parse('relative/path.ts');
      }).toThrow('Path must be relative');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {path: ""} => throws ZodError', () => {
      expect(() => {
        return relativeFilePathContract.parse('');
      }).toThrow();
    });

    it('INVALID: {path: 123} => throws ZodError', () => {
      expect(() => {
        return relativeFilePathContract.parse(123);
      }).toThrow();
    });

    it('INVALID: {path: null} => throws ZodError', () => {
      expect(() => {
        return relativeFilePathContract.parse(null);
      }).toThrow();
    });
  });
});
