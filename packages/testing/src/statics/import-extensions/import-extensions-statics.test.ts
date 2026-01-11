import { importExtensionsStatics } from './import-extensions-statics';

describe('importExtensionsStatics', () => {
  describe('typescript', () => {
    it('VALID: {} => contains .ts and .tsx extensions', () => {
      expect(importExtensionsStatics.typescript).toStrictEqual(['.ts', '.tsx']);
    });
  });

  describe('javascript', () => {
    it('VALID: {} => contains .js and .jsx extensions', () => {
      expect(importExtensionsStatics.javascript).toStrictEqual(['.js', '.jsx']);
    });
  });

  describe('all', () => {
    it('VALID: {} => contains all four extensions in order', () => {
      expect(importExtensionsStatics.all).toStrictEqual(['.ts', '.tsx', '.js', '.jsx']);
    });
  });
});
