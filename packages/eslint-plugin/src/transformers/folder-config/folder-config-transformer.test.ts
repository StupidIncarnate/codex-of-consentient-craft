import { folderTypeContract } from '../../contracts/folder-type/folder-type-contract';
import { folderConfigStatics } from '../../statics/folder-config/folder-config-statics';
import { folderConfigTransformer } from './folder-config-transformer';

describe('folderConfigTransformer', () => {
  describe('valid folder types', () => {
    it("VALID: {folderType: 'statics'} => returns statics config", () => {
      const folderType = folderTypeContract.parse('statics');

      const result = folderConfigTransformer({ folderType });

      expect(result).toStrictEqual(folderConfigStatics.statics);
    });

    it("VALID: {folderType: 'contracts'} => returns contracts config", () => {
      const folderType = folderTypeContract.parse('contracts');

      const result = folderConfigTransformer({ folderType });

      expect(result).toStrictEqual(folderConfigStatics.contracts);
    });

    it("VALID: {folderType: 'brokers'} => returns brokers config", () => {
      const folderType = folderTypeContract.parse('brokers');

      const result = folderConfigTransformer({ folderType });

      expect(result).toStrictEqual(folderConfigStatics.brokers);
    });

    it("VALID: {folderType: 'adapters'} => returns adapters config with allowedImports", () => {
      const folderType = folderTypeContract.parse('adapters');

      const result = folderConfigTransformer({ folderType });

      expect(result).toStrictEqual(folderConfigStatics.adapters);
      expect(result.allowedImports).toStrictEqual([
        'node_modules',
        'middleware/',
        'statics/',
        'contracts/',
      ]);
    });

    it("VALID: {folderType: 'startup'} => returns startup config with wildcard imports", () => {
      const folderType = folderTypeContract.parse('startup');

      const result = folderConfigTransformer({ folderType });

      expect(result).toStrictEqual(folderConfigStatics.startup);
      expect(result.allowedImports).toStrictEqual(['*']);
    });
  });
});
