import { folderNameTransformer } from './folder-name-transformer';

describe('folderNameTransformer', () => {
  describe('extract()', () => {
    it('VALID: {filePath: "src/contracts/user/user-contract.ts"} => returns "user" (immediate parent folder)', () => {
      const result = folderNameTransformer({
        filePath: 'src/contracts/user/user-contract.ts',
      });

      expect(result).toBe('user');
    });

    it('VALID: {filePath: "src/brokers/user/fetch/user-fetch-broker.ts"} => returns "fetch" (immediate parent)', () => {
      const result = folderNameTransformer({
        filePath: 'src/brokers/user/fetch/user-fetch-broker.ts',
      });

      expect(result).toBe('fetch');
    });

    it('VALID: {filePath: "src/statics/api/api-statics.ts"} => returns "api"', () => {
      const result = folderNameTransformer({
        filePath: 'src/statics/api/api-statics.ts',
      });

      expect(result).toBe('api');
    });

    it('VALID: {filePath: "deeply/nested/folder/structure/file.ts"} => returns "structure" (immediate parent)', () => {
      const result = folderNameTransformer({
        filePath: 'deeply/nested/folder/structure/file.ts',
      });

      expect(result).toBe('structure');
    });

    it('VALID: {filePath: "src/index.ts"} => returns "src" (immediate parent folder)', () => {
      const result = folderNameTransformer({
        filePath: 'src/index.ts',
      });

      expect(result).toBe('src');
    });

    it('EMPTY: {filePath: "index.ts"} => returns null (root-level file)', () => {
      const result = folderNameTransformer({
        filePath: 'index.ts',
      });

      expect(result).toBeNull();
    });

    it('EDGE: {filePath: "folder/file.ts"} => returns "folder"', () => {
      const result = folderNameTransformer({
        filePath: 'folder/file.ts',
      });

      expect(result).toBe('folder');
    });

    it('VALID: {filePath: "a/b/c/d/e/file.ts"} => returns "e" (multiple nested levels)', () => {
      const result = folderNameTransformer({
        filePath: 'a/b/c/d/e/file.ts',
      });

      expect(result).toBe('e');
    });

    it('EDGE: {filePath: "folder/subfolder/"} => returns "subfolder" (trailing slash)', () => {
      const result = folderNameTransformer({
        filePath: 'folder/subfolder/',
      });

      expect(result).toBe('subfolder');
    });

    it('VALID: {filePath: "my-folder/my-file.ts"} => returns "my-folder" (hyphenated names)', () => {
      const result = folderNameTransformer({
        filePath: 'my-folder/my-file.ts',
      });

      expect(result).toBe('my-folder');
    });
  });
});
