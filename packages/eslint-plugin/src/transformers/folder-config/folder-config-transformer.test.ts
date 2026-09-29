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

    it("VALID: {folderType: 'middleware'} => returns middleware config with allowedImports", () => {
      const result = folderConfigTransformer({ folderType: 'middleware' });

      expect(result).toStrictEqual(folderConfigStatics.middleware);
      expect(result!.allowedImports).toStrictEqual([
        'middleware/',
        'statics/',
        'contracts/',
        'guards/',
        'transformers/',
      ]);
    });

    it("VALID: {folderType: 'startup'} => returns startup config with restricted imports", () => {
      const result = folderConfigTransformer({ folderType: 'startup' });

      expect(result).toStrictEqual(folderConfigStatics.startup);
      expect(result!.allowedImports).toStrictEqual(['flows/', 'contracts/', 'statics/', 'errors/']);
    });
  });

  describe('invalid folder types', () => {
    it("INVALID: {folderType: 'adapters'} => returns undefined, since adapters is not a folder type", () => {
      const result = folderConfigTransformer({ folderType: 'adapters' });

      expect(result).toBe(undefined);
    });

    it("INVALID: {folderType: 'unknown'} => returns undefined", () => {
      const result = folderConfigTransformer({ folderType: 'unknown' });

      expect(result).toBe(undefined);
    });

    it("INVALID: {folderType: ''} => returns undefined", () => {
      const result = folderConfigTransformer({ folderType: '' });

      expect(result).toBe(undefined);
    });
  });
});
