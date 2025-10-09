import { filePathContract } from './file-path-contract';

describe('filePathContract', () => {
  describe('valid paths', () => {
    it('VALID: {path: "/absolute/path.ts"} => parses successfully', () => {
      const result = filePathContract.parse('/absolute/path.ts');

      expect(result).toBe('/absolute/path.ts');
    });

    it('VALID: {path: "./relative/path.ts"} => parses successfully', () => {
      const result = filePathContract.parse('./relative/path.ts');

      expect(result).toBe('./relative/path.ts');
    });

    it('VALID: {path: "../parent/path.ts"} => parses successfully', () => {
      const result = filePathContract.parse('../parent/path.ts');

      expect(result).toBe('../parent/path.ts');
    });

    it('VALID: {path: "C:\\\\Windows\\\\path.txt"} => parses successfully', () => {
      const result = filePathContract.parse('C:\\Windows\\path.txt');

      expect(result).toBe('C:\\Windows\\path.txt');
    });
  });

  describe('invalid npm module names', () => {
    it('INVALID: {path: "lodash"} => throws validation error', () => {
      expect(() => {
        return filePathContract.parse('lodash');
      }).toThrow();
    });

    it('INVALID: {path: "@react/core"} => throws validation error', () => {
      expect(() => {
        return filePathContract.parse('@react/core');
      }).toThrow();
    });

    it('INVALID: {path: "relative/path.ts"} => throws validation error', () => {
      expect(() => {
        return filePathContract.parse('relative/path.ts');
      }).toThrow();
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {path: ""} => throws ZodError', () => {
      expect(() => {
        return filePathContract.parse('');
      }).toThrow();
    });

    it('INVALID: {path: 123} => throws ZodError', () => {
      expect(() => {
        return filePathContract.parse(123);
      }).toThrow();
    });

    it('INVALID: {path: null} => throws ZodError', () => {
      expect(() => {
        return filePathContract.parse(null);
      }).toThrow();
    });

    it('INVALID: {path: undefined} => throws ZodError', () => {
      expect(() => {
        return filePathContract.parse(undefined);
      }).toThrow();
    });
  });
});
