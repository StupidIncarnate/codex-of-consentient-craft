import { importPathToFilePathTransformer } from './import-path-to-file-path-transformer';
import { FilePathStub } from '../../contracts/file-path/file-path.stub';
import { ImportPathStub } from '../../contracts/import-path/import-path.stub';

describe('importPathToFilePathTransformer', () => {
  describe('valid relative imports', () => {
    it('VALID: {relative import, file exists} => returns resolved file path', () => {
      const sourceFilePath = FilePathStub({ value: '/src/test.test.ts' });
      const importPath = ImportPathStub({ value: './test.proxy' });
      const resolvedPath = FilePathStub({ value: '/src/test.proxy.ts' });

      const result = importPathToFilePathTransformer({
        sourceFilePath,
        importPath,
        resolvedPath,
        fileExists: true,
      });

      expect(result).toBe('/src/test.proxy.ts');
    });

    it('VALID: {parent relative import, file exists} => returns resolved file path', () => {
      const sourceFilePath = FilePathStub({ value: '/src/tests/test.test.ts' });
      const importPath = ImportPathStub({ value: '../adapter.proxy' });
      const resolvedPath = FilePathStub({ value: '/src/adapter.proxy.ts' });

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
      const sourceFilePath = FilePathStub({ value: '/src/test.test.ts' });
      const importPath = ImportPathStub({ value: './nonexistent.proxy' });
      const resolvedPath = FilePathStub({ value: '/src/nonexistent.proxy.ts' });

      const result = importPathToFilePathTransformer({
        sourceFilePath,
        importPath,
        resolvedPath,
        fileExists: false,
      });

      expect(result).toBeNull();
    });
  });

  describe('non-relative imports', () => {
    it('INVALID: {npm package import} => returns null', () => {
      const sourceFilePath = FilePathStub({ value: '/src/test.test.ts' });
      const importPath = ImportPathStub({ value: 'axios' });
      const resolvedPath = FilePathStub({ value: '/node_modules/axios/index.js' });

      const result = importPathToFilePathTransformer({
        sourceFilePath,
        importPath,
        resolvedPath,
        fileExists: true,
      });

      expect(result).toBeNull();
    });

    it('INVALID: {scoped package import} => returns null', () => {
      const sourceFilePath = FilePathStub({ value: '/src/test.test.ts' });
      const importPath = ImportPathStub({ value: '@testing-library/react' });
      const resolvedPath = FilePathStub({ value: '/node_modules/@testing-library/react/index.js' });

      const result = importPathToFilePathTransformer({
        sourceFilePath,
        importPath,
        resolvedPath,
        fileExists: true,
      });

      expect(result).toBeNull();
    });
  });
});
