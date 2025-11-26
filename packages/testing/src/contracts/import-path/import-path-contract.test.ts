import { importPathContract } from './import-path-contract';
import { ImportPathStub } from './import-path.stub';

describe('importPathContract', () => {
  describe('valid import paths', () => {
    it('VALID: {value: "./test"} => parses relative path', () => {
      const importPath = ImportPathStub({ value: './test' });

      const result = importPathContract.parse(importPath);

      expect(result).toBe('./test');
    });

    it('VALID: {value: "../test.proxy"} => parses parent relative path', () => {
      const importPath = ImportPathStub({ value: '../test.proxy' });

      const result = importPathContract.parse(importPath);

      expect(result).toBe('../test.proxy');
    });

    it('VALID: {value: "axios"} => parses npm package', () => {
      const importPath = ImportPathStub({ value: 'axios' });

      const result = importPathContract.parse(importPath);

      expect(result).toBe('axios');
    });

    it('VALID: {value: "@scope/package"} => parses scoped package', () => {
      const importPath = ImportPathStub({ value: '@scope/package' });

      const result = importPathContract.parse(importPath);

      expect(result).toBe('@scope/package');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {value: empty string} => parses empty string', () => {
      const importPath = ImportPathStub({ value: '' });

      const result = importPathContract.parse(importPath);

      expect(result).toBe('');
    });
  });
});
