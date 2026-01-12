import { fileExtensionsStatics } from './file-extensions-statics';

describe('fileExtensionsStatics', () => {
  describe('source.typescript', () => {
    it('VALID: {} => contains .ts and .tsx extensions', () => {
      expect(fileExtensionsStatics.source.typescript).toStrictEqual(['.ts', '.tsx']);
    });
  });

  describe('source.javascript', () => {
    it('VALID: {} => contains .js and .jsx extensions', () => {
      expect(fileExtensionsStatics.source.javascript).toStrictEqual(['.js', '.jsx']);
    });
  });

  describe('source.all', () => {
    it('VALID: {} => contains all four source extensions in priority order', () => {
      expect(fileExtensionsStatics.source.all).toStrictEqual(['.ts', '.tsx', '.js', '.jsx']);
    });
  });

  describe('globs.typescript', () => {
    it('VALID: {} => returns glob pattern for TypeScript files', () => {
      expect(fileExtensionsStatics.globs.typescript).toBe('*.{ts,tsx}');
    });
  });

  describe('globs.javascript', () => {
    it('VALID: {} => returns glob pattern for JavaScript files', () => {
      expect(fileExtensionsStatics.globs.javascript).toBe('*.{js,jsx}');
    });
  });

  describe('globs.all', () => {
    it('VALID: {} => returns glob pattern for all source files', () => {
      expect(fileExtensionsStatics.globs.all).toBe('*.{ts,tsx,js,jsx}');
    });
  });
});
