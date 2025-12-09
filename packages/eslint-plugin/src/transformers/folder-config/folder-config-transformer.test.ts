import { folderConfigStatics } from '@dungeonmaster/shared/statics';
import { folderConfigTransformer } from './folder-config-transformer';

describe('folderConfigTransformer', () => {
  describe('valid folder types', () => {
    it("VALID: {folderType: 'statics'} => returns statics config", () => {
      const result = folderConfigTransformer({ folderType: 'statics' });

      expect(result).toStrictEqual(folderConfigStatics.statics);
    });

    it("VALID: {folderType: 'contracts'} => returns contracts config", () => {
      const result = folderConfigTransformer({ folderType: 'contracts' });

      expect(result).toStrictEqual(folderConfigStatics.contracts);
    });

    it("VALID: {folderType: 'brokers'} => returns brokers config", () => {
      const result = folderConfigTransformer({ folderType: 'brokers' });

      expect(result).toStrictEqual(folderConfigStatics.brokers);
    });

    it("VALID: {folderType: 'adapters'} => returns adapters config with allowedImports", () => {
      const result = folderConfigTransformer({ folderType: 'adapters' });

      expect(result).toStrictEqual(folderConfigStatics.adapters);
      expect(result!.allowedImports).toStrictEqual([
        'node_modules',
        'middleware/',
        'statics/',
        'contracts/',
        'guards/',
      ]);
    });

    it("VALID: {folderType: 'startup'} => returns startup config with wildcard imports", () => {
      const result = folderConfigTransformer({ folderType: 'startup' });

      expect(result).toStrictEqual(folderConfigStatics.startup);
      expect(result!.allowedImports).toStrictEqual(['*']);
    });
  });

  describe('invalid folder types', () => {
    it("INVALID: {folderType: 'unknown'} => returns undefined", () => {
      const result = folderConfigTransformer({ folderType: 'unknown' });

      expect(result).toBeUndefined();
    });

    it("INVALID: {folderType: ''} => returns undefined", () => {
      const result = folderConfigTransformer({ folderType: '' });

      expect(result).toBeUndefined();
    });
  });
});
