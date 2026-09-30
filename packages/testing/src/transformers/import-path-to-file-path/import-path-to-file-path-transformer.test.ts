import { importPathToFilePathTransformer } from './import-path-to-file-path-transformer';

describe('importPathToFilePathTransformer', () => {
  describe('valid relative imports', () => {
    it('VALID: {relative import, file exists} => returns resolved file path', () => {
      const sourceFilePath = '/src/test.test.ts';
      const importPath = './test.proxy';
      const resolvedPath = '/src/test.proxy.ts';

      const result = importPathToFilePathTransformer({
        sourceFilePath,
        importPath,
        resolvedPath,
        fileExists: true,
      });

      expect(result).toBe('/src/test.proxy.ts');
    });

    it('VALID: {parent relative import, file exists} => returns resolved file path', () => {
      const sourceFilePath = '/src/tests/test.test.ts';
      const importPath = '../adapter.proxy';
      const resolvedPath = '/src/adapter.proxy.ts';

      const result = importPathToFilePathTransformer({
        sourceFilePath,
        importPath,
        resolvedPath,
        fileExists: true,
      });

      expect(result).toBe('/src/adapter.proxy.ts');
    });
  });

  describe('file does not exist', () => {
    it('INVALID: {relative import, file does not exist} => returns null', () => {
      const sourceFilePath = '/src/test.test.ts';
      const importPath = './nonexistent.proxy';
      const resolvedPath = '/src/nonexistent.proxy.ts';

      const result = importPathToFilePathTransformer({
        sourceFilePath,
        importPath,
        resolvedPath,
        fileExists: false,
      });

      expect(result).toBe(null);
    });
  });

  describe('workspace package testing subpaths', () => {
    it('VALID: {@dungeonmaster/bin/testing, file exists} => returns resolved file path', () => {
      const sourceFilePath = '/src/test.test.ts';
      const importPath = '@dungeonmaster/bin/testing';
      const resolvedPath = '/repo/packages/bin/testing.ts';

      const result = importPathToFilePathTransformer({
        sourceFilePath,
        importPath,
        resolvedPath,
        fileExists: true,
      });

      expect(result).toBe('/repo/packages/bin/testing.ts');
    });

    it('INVALID: {@dungeonmaster/bin/testing, file does not exist} => returns null', () => {
      const sourceFilePath = '/src/test.test.ts';
      const importPath = '@dungeonmaster/bin/testing';
      const resolvedPath = '/repo/packages/bin/testing.ts';

      const result = importPathToFilePathTransformer({
        sourceFilePath,
        importPath,
        resolvedPath,
        fileExists: false,
      });

      expect(result).toBe(null);
    });
  });

  describe('non-relative imports', () => {
    it('INVALID: {npm package import} => returns null', () => {
      const sourceFilePath = '/src/test.test.ts';
      const importPath = 'axios';
      const resolvedPath = '/node_modules/axios/index.js';

      const result = importPathToFilePathTransformer({
        sourceFilePath,
        importPath,
        resolvedPath,
        fileExists: true,
      });

      expect(result).toBe(null);
    });

    it('INVALID: {scoped package import} => returns null', () => {
      const sourceFilePath = '/src/test.test.ts';
      const importPath = '@testing-library/react';
      const resolvedPath = '/node_modules/@testing-library/react/index.js';

      const result = importPathToFilePathTransformer({
        sourceFilePath,
        importPath,
        resolvedPath,
        fileExists: true,
      });

      expect(result).toBe(null);
    });
  });
});
