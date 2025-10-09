import { absoluteFilePathContract } from './absolute-file-path-contract';

describe('absoluteFilePathContract', () => {
  describe('valid absolute paths', () => {
    it('VALID: {path: "/absolute/path.ts"} => parses successfully', () => {
      const result = absoluteFilePathContract.parse('/absolute/path.ts');

      expect(result).toBe('/absolute/path.ts');
    });

    it('VALID: {path: "/home/user/file.txt"} => parses successfully', () => {
      const result = absoluteFilePathContract.parse('/home/user/file.txt');

      expect(result).toBe('/home/user/file.txt');
    });

    it('VALID: {path: "C:\\\\Windows\\\\path.txt"} => parses successfully', () => {
      const result = absoluteFilePathContract.parse('C:\\Windows\\path.txt');

      expect(result).toBe('C:\\Windows\\path.txt');
    });

    it('VALID: {path: "D:\\\\Projects\\\\app\\\\file.js"} => parses successfully', () => {
      const result = absoluteFilePathContract.parse('D:\\Projects\\app\\file.js');

      expect(result).toBe('D:\\Projects\\app\\file.js');
    });
  });

  describe('invalid relative paths', () => {
    it('INVALID: {path: "./relative/path.ts"} => throws validation error', () => {
      expect(() => {
        return absoluteFilePathContract.parse('./relative/path.ts');
      }).toThrow('Path must be absolute');
    });

    it('INVALID: {path: "../parent/path.ts"} => throws validation error', () => {
      expect(() => {
        return absoluteFilePathContract.parse('../parent/path.ts');
      }).toThrow('Path must be absolute');
    });
  });

  describe('invalid npm module names', () => {
    it('INVALID: {path: "lodash"} => throws validation error', () => {
      expect(() => {
        return absoluteFilePathContract.parse('lodash');
      }).toThrow('Path must be absolute');
    });

    it('INVALID: {path: "@react/core"} => throws validation error', () => {
      expect(() => {
        return absoluteFilePathContract.parse('@react/core');
      }).toThrow('Path must be absolute');
    });

    it('INVALID: {path: "relative/path.ts"} => throws validation error', () => {
      expect(() => {
        return absoluteFilePathContract.parse('relative/path.ts');
      }).toThrow('Path must be absolute');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {path: ""} => throws ZodError', () => {
      expect(() => {
        return absoluteFilePathContract.parse('');
      }).toThrow();
    });

    it('INVALID: {path: 123} => throws ZodError', () => {
      expect(() => {
        return absoluteFilePathContract.parse(123);
      }).toThrow();
    });

    it('INVALID: {path: null} => throws ZodError', () => {
      expect(() => {
        return absoluteFilePathContract.parse(null);
      }).toThrow();
    });
  });
});
